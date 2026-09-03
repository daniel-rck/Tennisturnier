/**
 * Read `arr[i]` where the index is provably in range — a bounded loop, or an
 * access guarded by a prior length check.
 *
 * `noUncheckedIndexedAccess` cannot see those proofs, so every such read widens
 * to `T | undefined`. The alternatives are worse: a `!` assertion drops the
 * check entirely, and threading `if (x === undefined) continue` through a
 * scheduling hot loop buries the algorithm in noise. This keeps a real runtime
 * check and fails loudly if an assumption ever stops holding.
 */
export function at<T>(arr: ArrayLike<T>, i: number): T {
  const value = arr[i];
  if (value === undefined) {
    throw new RangeError(`Index ${i} is out of range (length ${arr.length}).`);
  }
  return value;
}
