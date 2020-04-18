import Array "mo:stdlib/array";
import Hash "mo:stdlib/hash";
import HashMap "mo:stdlib/hashMap";

module {
    public type Time = Nat;
    public type Diff = Int;
    public type ValueDiff = {
        time: Time;
        diff: Diff;
    };
    public type Trace<Key> = HashMap.HashMap<Key, [ValueDiff]>;
    public type ExportTrace<Key> = [(Key, [ValueDiff])];

    public class Collection<K>(
        keyEq: (K,K) -> Bool,
        keyHash: K -> Hash.Hash) {
        public let trace: Trace<K> = HashMap.HashMap(0, keyEq, keyHash);
        public func exportTrace(): ExportTrace<K> {
            var res: ExportTrace<K> = [];
            for ((k, diffs) in trace.iter()) {
                res := Array.append<(K, [ValueDiff])>(res, [(k, diffs)]);
            };
            return res;
        };
        public func insert(k: K, t: Time) {
            let diff = { time = t; diff = 1 };
            let diffs = switch (trace.get(k)) {
                case null { [diff] };
                case (?diffs) { Array.append<ValueDiff>(diffs, [diff]) };
            };
            ignore trace.set(k, diffs);
        };
        public func map(f:K -> K): Collection<K> {
            let res = Collection<K>(keyEq, keyHash);
            for ((k,diffs) in trace.iter()) {
                let new_k = f(k);
                for (diff in diffs.vals()) {
                    res.insert(new_k, diff.time);
                }
            };
            return res;
        }
    };
}