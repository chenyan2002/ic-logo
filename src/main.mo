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

type Coord = { x: Float; y: Float };

type Statements = List.List<Statement>;

type Statement = {
    #forward: Exp;
    #left: Exp;
    #right: Exp;
    #home;
    #repeat: (Nat, Statements);
};

type Exp = {
    #Num: Float;
    #Var: Text;
    #Add: (Exp, Exp);
};

type Env = H.HashMap<Text, Float>;

type Object = {
    #line: { start: Coord; end: Coord };
};

class Turtle () {
    public var x : Float = 300.0;
    public var y : Float = 300.0;
    public var dir : Float = 90.0;
    public func home() {
        x := 300.0; y := 300.0; dir := 90.0;
    };
    public func setCoord(coord: Coord) {
        x := coord.x; y := coord.y;
    };
    public func turn(degree: Float) {
        dir := (dir - degree + 360.0) % 360.0;
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
                 let step = evalExp(env, exp);
                 let s = { x=pos.x; y=pos.y };
                 let degree = pos.dir * F.pi / 180.0;
                 let new_x = pos.x + F.cos(degree) * step;
                 let new_y = pos.y - F.sin(degree) * step;
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
    public func evalExp(env:Env, exp:Exp): Float {
        switch exp {
        case (#Num(num)) {
                 num
             };
        case (#Var(v)) {
                 switch (env.get(v)) {
                 case (?num) num;
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
    let env = H.HashMap<Text, Float>(1, Text.equal, Text.hash);
    env.put("test", 100.0);
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
    public query func fakeEval(stat:Statement): async ([Object], Float, Float, Float) {
        let env = initEnv();
        E.eval(env, stat);
        (E.objects.toArray(), E.pos.x, E.pos.y, E.pos.dir)
    };
    public query func evalExp(exp:Exp): async Float {
        let env = initEnv();
        E.evalExp(env, exp)
    };
    
    public query func output() : async ([Object], Float, Float, Float) {
        (E.objects.toArray(), E.pos.x, E.pos.y, E.pos.dir)
    };
};
