import Array "mo:stdlib/array";
import Hash "mo:stdlib/hash";
import HashMap "mo:stdlib/hashMap";
import PQ "pq";

module {
    public type Time = Nat;
    public type Diff = Int;
    public type ValueDiff = {
        time: Time;
        diff: Diff;
    };
    public type Trace<Key> = HashMap.HashMap<Key, PQ.PQ<ValueDiff>>;
    public type ExportTrace<Key> = [(Key, [ValueDiff])];

    func ord(x: ValueDiff, y: ValueDiff): Bool { x.time < y.time };

    public class Collection<K>(
      keyEq: (K,K) -> Bool,
      keyHash: K -> Hash.Hash) {
        public let trace: Trace<K> = HashMap.HashMap(0, keyEq, keyHash);
        public func exportTrace(): ExportTrace<K> {
            var res: ExportTrace<K> = [];
            for ((k, diffs) in trace.iter()) {
                let vec_diffs = diffs.heap.toArray();
                res := Array.append<(K, [ValueDiff])>(res, [(k, vec_diffs)]);
            };
            return res;
        };
        public func insert(k: K, t: Time) {
            let diff = { time = t; diff = 1 };
            let diffs = switch (trace.get(k)) {
            case null { let pq = PQ.PQ(ord); pq.add(diff); pq };
            case (?diffs) { diffs.add(diff); diffs };
            };
            ignore trace.set(k, diffs);
        };
        public func map(f:K -> K): Collection<K> {
            let res = Collection<K>(keyEq, keyHash);
            for ((k,diffs) in trace.iter()) {
                let new_k = f(k);
                for (diff in diffs.heap.iter()) {
                    res.insert(new_k, diff.time);
                }
            };
            return res;
        }
    };
}
