import Prim "mo:prim";

module {
    public let pi : Float = 3.141592653589793238;
    public let sin : Float -> Float = Prim.sin;
    public let cos : Float -> Float = Prim.cos;
    public let fromInt : Int -> Float = func(x) {
        Prim.int64ToFloat(Prim.intToInt64(x))
    };
    public let toInt : Float -> Int = func(x) {
        Prim.int64ToInt(Prim.floatToInt64(Prim.floatNearest(x)))
    };
}
