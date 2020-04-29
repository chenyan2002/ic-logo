import Float "mo:base/Float";
import Int "mo:base/Int";

module {
    public let pi : Float = 3.141592653589793238;
    public let sin : Float -> Float = Float.sin;
    public let cos : Float -> Float = Float.cos;
    public let fromInt : Int -> Float = func(x) {
        Float.ofInt64(Int.toInt64(x))
    };
    public let toInt : Float -> Int = func(x) {
        Int.fromInt64(Float.toInt64(Float.nearest(x)))
    };
}
