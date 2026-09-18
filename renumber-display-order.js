/**
 * One-time repair for display_order on the tasks table.
 *
 * New tasks were created with a broken "highest existing order" lookup
 * (.eq('parent_task_id', null) never matches NULL in PostgREST), so every
 * top-level task ended up with display_order 0 or 1 and custom ordering was
 * meaningless. This assigns sequential 1..N orders, preserving the order the
 * app currently displays: display_order first, then id as the tie-breaker.
 *
 * Writes a backup of the current values to display-order-backup.json before
 * changing anything. Safe to re-run; it is idempotent.
 *
 * Usage: node renumber-display-order.js [--dry-run]
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const dryRun = process.argv.includes('--dry-run');

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8')
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .map(line => {
      const i = line.indexOf('=');
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    })
);

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Current display order, then id, so existing relative order survives.
const byCurrentOrder = (a, b) =>
  (a.display_order ?? 0) - (b.display_order ?? 0) || a.id - b.id;

async function renumber() {
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('id, title, parent_task_id, display_order');

  if (error) throw error;
  console.log(`Loaded ${tasks.length} tasks.`);

  // Timestamped, and skipped on a dry run, so re-running can never clobber the
  // backup taken before the real change.
  if (!dryRun) {
    const backupFile = `display-order-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(
      backupFile,
      JSON.stringify(
        { created_at: new Date().toISOString(), tasks: tasks.map(t => ({ id: t.id, display_order: t.display_order })) },
        null,
        2
      )
    );
    console.log(`Backed up current display_order values to ${backupFile}`);
  }

  // Group into the lists the UI actually orders: top-level tasks, and each
  // parent's subtasks.
  const groups = new Map();
  for (const task of tasks) {
    const key = task.parent_task_id ?? 'top';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(task);
  }

  const updates = [];
  for (const [key, group] of groups) {
    group.sort(byCurrentOrder);
    group.forEach((task, index) => {
      const newOrder = index + 1;
      if (task.display_order !== newOrder) {
        updates.push({ id: task.id, title: task.title, from: task.display_order, to: newOrder });
      }
    });
    console.log(`  ${key === 'top' ? 'top-level' : `subtasks of #${key}`}: ${group.length} task(s) -> 1..${group.length}`);
  }

  if (updates.length === 0) {
    console.log('Nothing to change; orders are already sequential.');
    return;
  }

  console.log(`\n${updates.length} task(s) need a new display_order.`);
  if (dryRun) {
    updates.forEach(u => console.log(`  [dry run] #${u.id} ${u.from} -> ${u.to}  ${u.title}`));
    return;
  }

  // Batched so a large table doesn't fire hundreds of simultaneous requests.
  const batchSize = 20;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(u =>
        supabase.from('tasks').update({ display_order: u.to }).eq('id', u.id)
      )
    );
    const failed = results.find(r => r.error);
    if (failed) throw failed.error;
    console.log(`  updated ${Math.min(i + batchSize, updates.length)}/${updates.length}`);
  }

  // Read back and confirm every group is a clean 1..N sequence.
  const { data: after, error: afterError } = await supabase
    .from('tasks')
    .select('id, parent_task_id, display_order');
  if (afterError) throw afterError;

  const verifyGroups = new Map();
  for (const task of after) {
    const key = task.parent_task_id ?? 'top';
    if (!verifyGroups.has(key)) verifyGroups.set(key, []);
    verifyGroups.get(key).push(task.display_order);
  }

  let ok = true;
  for (const [key, orders] of verifyGroups) {
    const sorted = [...orders].sort((a, b) => a - b);
    const expected = sorted.map((_, i) => i + 1);
    if (JSON.stringify(sorted) !== JSON.stringify(expected)) {
      console.error(`  FAILED ${key}: got ${sorted.join(',')}`);
      ok = false;
    }
  }

  console.log(ok ? '\nDone. Every list is now a clean 1..N sequence.' : '\nVerification failed.');
  if (!ok) process.exit(1);
}

renumber().catch(err => {
  console.error('Renumber failed:', err);
  process.exit(1);
});
