import T "./types";

actor {
    let E = T.Evaluator();
    public func clear(): async () {
        E.pos.home();
        E.objects.clear();
    };
    public func eval(stat:T.Statement): async () {
        let env = T.initEnv();
        E.eval(env, stat);
    };
    public query func fakeEval(stat:T.Statement): async ([T.Object], Int, Int, Int) {
        let env = T.initEnv();
        E.eval(env, stat);
        (E.objects.toArray(), E.pos.x, E.pos.y, E.pos.dir)
    };
    public query func evalExp(exp:T.Exp): async Int {
        let env = T.initEnv();
        E.evalExp(env, exp)
    };
    
    public query func output() : async ([T.Object], Int, Int, Int) {
        (E.objects.toArray(), E.pos.x, E.pos.y, E.pos.dir)
    };
};
