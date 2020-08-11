import A "mo:base/Array";
import P "mo:base/Prelude";
import List "mo:base/List";
import Text "mo:base/Text";
import H "mo:base/HashMap";
import Hash "mo:base/Hash";
import B "mo:base/Buffer";
import Prim "mo:prim";
import F "mo:base/Float";

let N = 600;

type Coord = { x: Int; y: Int };

type Statements = List.List<Statement>;

type Statement = {
    #forward: Exp;
    #left: Exp;
    #right: Exp;
    #home;
    #repeat: (Nat, Statements);
};

type Exp = {
    #Int: Int;
    #Var: Text;
    #Add: (Exp, Exp);
};

type Env = H.HashMap<Text, Int>;
func varEq(v1: Text, v2: Text): Bool {
    v1 == v2;
};

type Object = {
    #line: { start: Coord; end: Coord };
};

class Turtle () {
    public var x : Int = 300;
    public var y : Int = 300;
    public var dir : Int = 90;
    public func home() {
        x := 300; y := 300; dir := 90;
    };
    public func setCoord(coord: Coord) {
        x := coord.x; y := coord.y;
    };
    public func turn(degree: Int) {
        dir := (dir - degree + 360) % 360;
    };
};

class Evaluator() {
    public let objects : B.Buffer<Object> = B.Buffer(10);
    public let pos : Turtle = Turtle();
    public func eval(env:Env, stat:Statement) {
        switch stat {
        case (#home) {
                 pos.home();
             };
        case (#forward(exp)) {
                 let step = F.fromInt(evalExp(env, exp));
                 let s = { x=pos.x; y=pos.y };
                 let degree = F.fromInt(pos.dir) * F.pi / 180.0;
                 let new_x = pos.x + F.toInt(F.nearest(F.cos(degree) * step));
                 let new_y = pos.y - F.toInt(F.nearest(F.sin(degree) * step));
                 let e: Coord = { x=new_x; y=new_y };
                 let line = #line { start=s; end=e };
                 objects.add(line);
                 pos.setCoord(e);
             };
        case (#right(exp)) {
                 let degree = evalExp(env, exp);
                 pos.turn(degree);
             };
        case (#left(exp)) {
                 let degree = evalExp(env, exp);
                 pos.turn(-degree);
             };
        case (#repeat(n, block)) {
                 var i = 0;
                 while (i < n) {
                     List.iterate<Statement>(block, func (s:Statement) { eval(env, s) });
                     i += 1;
                 };
             };
        };
    };
    public func evalExp(env:Env, exp:Exp): Int {
        switch exp {
        case (#Int(int)) {
                 int
             };
        case (#Var(v)) {
                 switch (env.get(v)) {
                 case (?int) int;
                 case null P.unreachable();
                 };
             };
        case (#Add(e1,e2)) {
                 evalExp(env, e1) + evalExp(env, e2)
             };
        };
    };
};

func initEnv(): Env {
    let env = H.HashMap<Text, Int>(1, varEq, Text.hash);
    env.put("test", 100);
    env;
};

actor {
    let E = Evaluator();
    public func clear(): async () {
        E.pos.home();
        E.objects.clear();
    };
    public func eval(stat:Statement): async () {
        let env = initEnv();
        E.eval(env, stat);
    };
    public query func fakeEval(stat:Statement): async ([Object], Int, Int, Int) {
        let env = initEnv();
        E.eval(env, stat);
        (E.objects.toArray(), E.pos.x, E.pos.y, E.pos.dir)
    };
    public query func evalExp(exp:Exp): async Int {
        let env = initEnv();
        E.evalExp(env, exp)
    };
    
    public query func output() : async ([Object], Int, Int, Int) {
        (E.objects.toArray(), E.pos.x, E.pos.y, E.pos.dir)
    };
};
