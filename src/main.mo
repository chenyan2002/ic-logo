import A "mo:stdlib/array";
import P "mo:stdlib/prelude";
import List "mo:stdlib/list";
import H "mo:stdlib/hashMap";
import Hash "mo:stdlib/hash";
import B "mo:stdlib/buf";

let N = 600;

type Coord = { x: Int; y: Int };

type Statements = List.List<Statement>;

type Statement = {
    #forward: Exp;
    #left;
    #right;
    #home;
    #block: Statements;
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
    public func delta(): (Int, Int) {
        switch dir {
        case 0 (1,0);
        case 90 (0,-1);
        case 180 (-1,0);
        case 270 (0,1);
        case _ P.unreachable();
        }
    };
    public func setCoord(coord: Coord) {
        x := coord.x; y := coord.y;
    };
    public func turn(degree: Int) {
        dir := (dir - degree + 360) % 360;
    };
};

class Evaluator() {
    public let objects : B.Buf<Object> = B.Buf(10);
    public var pos : Turtle = Turtle();
    public func eval(env:Env, stat:Statement) {
        switch stat {
        case (#home) {
                 pos.home();
                 objects.clear();
             };
        case (#forward(exp)) {
                 let step = evalExp(env, exp);
                 let s = { x=pos.x; y=pos.y+0 };
                 let (dx,dy) = pos.delta();
                 let e: Coord = { x=pos.x+dx*step; y=pos.y+dy*step };
                 let line = #line { start=s; end=e };
                 objects.add(line);
                 pos.setCoord(e);
             };
        case (#right) {
                 pos.turn(90);
             };
        case (#left) {
                 pos.turn(-90);
             };
        case (#block(list)) {
                 List.iter<Statement>(list, func (s:Statement) { eval(env, s) });
             };
        case (#repeat(n, block)) {
                 var i = 0;
                 while (i < n) {
                     eval(env, #block block);
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
    let env = H.HashMap<Text, Int>(1, varEq, Hash.hashOfText);
    ignore (env.set("test", 100));
    env;
};

actor {
    let E = Evaluator();
    public func eval(stat:Statement): async () {
        let env = initEnv();
        E.eval(env, stat);
    };
    public func evalExp(exp:Exp): async Int {
        let env = initEnv();
        E.evalExp(env, exp)
    };
    
    public query func output() : async ([Object], Int, Int, Int) {
        (E.objects.toArray(), E.pos.x, E.pos.y, E.pos.dir)
    };
};
