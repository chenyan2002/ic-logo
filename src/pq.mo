import Buf "mo:stdlib/buf";
import D "mo:stdlib/debug";

module {
    public class PQ<T>(ord: (T, T) -> Bool) {
        public let heap = Buf.Buf<T>(0);
        public func add(x: T) {
            let i = heap.len();
            heap.add(x);
            up_heap(i);
        };
        /*
        public func pop(): ?T {
            let n = heap.len();
            if (n == 0) {
                return null;
            };
            let x = h.get(0);
            let y = h.get(n - 1);
            h.set(0, y);
            // h.remove_last();
            down_heap(pq, 0);
            ?x
        };
        func down_heap<T>(pq: PQ<T>, i: Nat) {
            let h = pq.heap;
            let ord = pq.order;
            let n = h.len();
            let x = h.get(i);
            func down_heap(j: Nat) {
                if (2 * j + 1 < n) {
                    let l = 2 * j + 1;
                    let r = 2 * j + 2;
                    let k = if (r < n and not ord(h.get(l), h.get(r))) { r } else { l };
                    let y = h.get(k);
                    if (ord(x, y)) {
                        h.set(j, x);
                    } else {
                        h.set(j, y);
                        down_heap(k);
                    }
                } else if (j != i) {
                    h.set(j, x);
                }
            };
            down_heap(i)
        };*/
        func up_heap(i: Nat) {
            let x = heap.get(i);
            func up_heap_(j: Nat) {
                let k = (j - 1) / 2;
                let y = heap.get(k);
                if (j == 0 or ord(y,x)) {
                    heap.set(j, x);
                } else {
                    heap.set(j, y);
                    up_heap_(k);
                }
            };
            if (i > 0) {
                up_heap_(i);
            };
        };
    };
}
