// META: title=StorageManager: estimate() usage breakdown for indexeddb
// META: script=../IndexedDB/support-promises.js
// META: script=helpers.js

promise_test(async t => {
  const estimate = await navigator.storage.estimate()
  assert_equals(typeof estimate.breakdown, 'object');
}, 'estimate() resolves to dictionary with usage breakdown member');

promise_test(async t => {
  await deleteAllDatabases(t);

  const arraySize = 1e6;
  const objectStoreName = "storageManager";
  const dbname = self.location.pathname;

  let estimate = await navigator.storage.estimate();
  const usageBeforeCreate = estimate.usage;
  const breakdownBeforeCreate = estimate.breakdown;

  assert_equals(usageBeforeCreate, breakdownBeforeCreate.IndexedDb,
    'breakdown should match usage before object store is created');

  const db = await openDB(dbname, objectStoreName, t);

  estimate = await navigator.storage.estimate();
  const usageAfterCreate = estimate.usage;
  const breakdownAfterCreate = estimate.breakdown;

  assert_equals(usageAfterCreate, breakdownAfterCreate.IndexedDb,
    'breakdown should match usage after object store is created.');
  assert_greater_than(
    usageAfterCreate, usageBeforeCreate,
    'estimated usage should increase after object store is created.');
  assert_true(
    objEqualsExceptForKeys(breakdownBeforeCreate, breakdownAfterCreate,
      ['IndexedDb']),
    'after create, breakdown object should remain ' +
    'unchanged aside from IndexedDb usage.');

  const txn = db.transaction(objectStoreName, 'readwrite');
  const buffer = new ArrayBuffer(arraySize);
  const view = new Uint8Array(buffer);

  for (let i = 0; i < arraySize; i++) {
    view[i] = Math.floor(Math.random() * 255);
  }

  const testBlob = new Blob([buffer], {
    type: "binary/random"
  });
  txn.objectStore(objectStoreName).add(testBlob, 1);

  await transactionPromise(txn);

  estimate = await navigator.storage.estimate();
  const usageAfterPut = estimate.usage;
  const breakdownAfterPut = estimate.breakdown;

  assert_equals(usageAfterPut, breakdownAfterPut.IndexedDb,
    'breakdown should match usage after large value is stored');
  assert_greater_than(
    usageAfterPut, usageAfterCreate,
    'estimated usage should increase after large value is stored');
  assert_true(
    objEqualsExceptForKeys(breakdownAfterCreate, breakdownAfterPut,
      ['IndexedDb']),
    'after put, breakdown object should remain unchanged ' +
    'aside from IndexedDb usage.');

  db.close();
}, 'estimate() usage breakdown reflects increase after large value is stored');
