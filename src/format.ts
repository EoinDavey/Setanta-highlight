import { escape } from "he";
import * as P from "./gen_parser";
import { ASTKinds } from "./gen_parser";

type Stmt = P.AsgnStmt | P.NonAsgnStmt;

interface Block extends Array<string | Block> { }

class Formatter {
    private indent = 0;
    private out: string[] = [];
    public format(p: P.Program): string {
        for (const st of p.stmts) {
            this.fStmt(st);
        }
        this.fWs(p.ws);
        return this.out.join("");
    }
    public fStmt(s: Stmt) {
        switch (s.kind) {
            case ASTKinds.IfStmt:
                return this.fIfStmt(s);
            case ASTKinds.BlockStmt:
                return this.fBlockStmt(s);
            case ASTKinds.NuairStmt:
                return this.fNuairStmt(s);
            case ASTKinds.LeStmt:
                return this.fLeStmt(s);
            case ASTKinds.CCStmt:
                return this.fCC(s);
            case ASTKinds.BrisStmt:
                return this.fBris(s);
            case ASTKinds.CtlchStmt:
                return this.fCtlchStmt(s);
            case ASTKinds.GniomhStmt:
                return this.fGníomhStmt(s);
            case ASTKinds.ToradhStmt:
                return this.fToradh(s);
            case ASTKinds.AssgnStmt:
                return this.fAssgnStmt(s);
            case ASTKinds.DefnStmt:
                return this.fDefnStmt(s);
            case ASTKinds.And: // Expression
                this.fExpr(s);
                break;
            default:
                const n: never = s;
        }
    }

    public fIfStmt(i: P.IfStmt) {
        this.fWs(i.ws);
        this.pr("má", "k");
        this.fExpr(i.expr);
        this.fStmt(i.stmt);
        if (i.elsebranch) {
            this.fWs(i.elsebranch.ws);
            this.pr("nó", "k");
            this.fStmt(i.elsebranch.stmt);
        }
    }
    public fBlockStmt(b: P.BlockStmt) {
        this.fWs(b.wsa);
        this.pr("{");
        for (const st of b.blk) {
            this.fStmt(st);
        }
        this.fWs(b.wsb);
        this.pr("}");
    }
    public fNuairStmt(n: P.NuairStmt) {
        this.fWs(n.ws);
        this.pr("nuair-a", "k");
        this.fExpr(n.expr);
        this.fStmt(n.stmt);
    }
    public fLeStmt(l: P.LeStmt) {
        this.fWs(l.wsa);
        this.pr("le", "k");
        this.fID(l.id);
        this.fWs(l.wsb);
        this.pr("idir", "k");
        this.fWs(l.wsc);
        this.pr("(");
        this.fExpr(l.strt);
        this.fWs(l.wsd);
        this.pr(",", "p");
        this.fExpr(l.end);
        if (l.step) {
            this.fWs(l.step.ws);
            this.pr(",", "p");
            this.fExpr(l.step.step);
        }
        this.fWs(l.wse);
        this.pr(")");
        this.fStmt(l.stmt);
    }
    public fDefnStmt(d: P.DefnStmt) {
        this.fWs(d.wsa);
        this.fID(d.id);
        this.fWs(d.wsb);
        this.pr(":=");
        this.fWs(d.wsc);
        this.fExpr(d.expr);
    }
    public fAssgnStmt(a: P.AssgnStmt) {
        this.fWs(a.wsa);
        this.fPostfix(a.lhs);
        this.fWs(a.wsb);
        this.pr(`${a.op}`);
        this.fWs(a.wsc);
        this.fExpr(a.expr);
    }
    public fGníomhStmt(gn: P.GniomhStmt) {
        this.fWs(gn.wsa);
        this.pr("gníomh", "k");
        this.fID(gn.id);
        this.fWs(gn.wsb);
        this.pr("(");
        if (gn.args) {
            this.fCSIDs(gn.args);
        }
        this.fWs(gn.wsc);
        this.pr(")");
        this.fWs(gn.wsd);
        this.pr("{");
        for (const st of gn.stmts) {
            this.fStmt(st);
        }
        this.fWs(gn.wse);
        this.pr("}");
    }
    public fCtlchStmt(ct: P.CtlchStmt) {
        this.fWs(ct.wsa);
        this.pr("creatlach", "k");
        this.fID(ct.id);
        if (ct.tuis) {
            this.fWs(ct.tuis.wsa);
            this.pr("ó", "o");
            this.fWs(ct.tuis.wsb);
            this.fID(ct.tuis.id);
        }
        this.fWs(ct.wsb);
        this.pr("{");
        for (const gn of ct.gniomhs) {
            this.fStmt(gn);
        }
        this.fWs(ct.wsc);
        this.pr("}");
    }
    public fBris(c: P.BrisStmt) {
        this.fWs(c.ws);
        this.pr("bris", "k");
    }
    public fCC(c: P.CCStmt) {
        this.fWs(c.ws);
        this.pr("chun-cinn", "k");
    }
    public fToradh(t: P.ToradhStmt) {
        this.fWs(t.ws);
        this.pr("toradh", "k");
        if (t.exp) {
            this.fExpr(t.exp);
        }
    }
    public fExpr(e: P.Expr) {this.fAnd(e); }
    public fAnd(p: P.And) {
        this.fOr(p.head);
        for (const t of p.tail) {
            this.fWs(t.ws);
            this.pr("&", "o");
            this.fOr(t.trm);
        }
    }
    public fOr(p: P.Or) {
        this.fEq(p.head);
        for (const t of p.tail) {
            this.fWs(t.ws);
            this.pr("|", "o");
            this.fEq(t.trm);
        }
    }
    public fEq(p: P.Eq) {
        this.fComp(p.head);
        for (const t of p.tail) {
            this.fWs(t.ws);
            this.pr(`${t.op}`, "o");
            this.fComp(t.trm);
        }
    }
    public fComp(p: P.Comp) {
        this.fSum(p.head);
        for (const t of p.tail) {
            this.fWs(t.ws);
            this.pr(`${t.op}`, "o");
            this.fSum(t.trm);
        }
    }
    public fSum(p: P.Sum) {
        this.fProduct(p.head);
        for (const t of p.tail) {
            this.fWs(t.ws);
            this.pr(`${t.op}`, "o");
            this.fProduct(t.trm);
        }
    }
    public fProduct(p: P.Product) {
        this.fPrefix(p.head);
        for (const t of p.tail) {
            this.fWs(t.ws);
            this.pr(`${t.op}`, "o");
            this.fPrefix(t.trm);
        }
    }
    public fPrefix(p: P.Prefix) {
        this.fWs(p.ws);
        if (p.op) {
            this.pr(p.op);
        }
        this.fPostfix(p.pf);
    }
    public fPostfix(p: P.Postfix) {
        this.fObjLookups(p.at);
        for (const op of p.ops) {
            this.fPostOp(op);
        }
    }
    public fObjLookups(o: P.ObjLookups) {
        for (const at of o.attrs) {
            this.fID(at.id);
            this.pr("@", "o");
        }
        this.fAtom(o.root);
    }
    public fPostOp(p: P.PostOp) {
        if (p.kind === ASTKinds.PostOp_1) {
            this.pr("(");
            if (p.args) {
                this.fCSArgs(p.args);
            }
            this.fWs(p.ws);
            this.pr(")");
        } else {
            this.pr("[");
            this.fExpr(p.expr);
            this.fWs(p.ws);
            this.pr("]");
        }
    }
    public fAtom(l: P.Atom) {
        switch (l.kind) {
            case ASTKinds.Atom_1:
                this.fWs(l.ws);
                this.pr("(");
                this.fExpr(l.trm);
                this.pr(")");
                break;
            case ASTKinds.ID:
                this.fID(l);
                break;
            case ASTKinds.Litreacha:
                this.fLit(l);
                break;
            case ASTKinds.Int:
                this.fInt(l);
                break;
            case ASTKinds.Bool:
                this.fBool(l);
                break;
            case ASTKinds.Neamhni:
                this.fNeamhni(l);
                break;
            case ASTKinds.ListLit:
                this.fListLit(l);
                break;
            default:
                const n: never = l;
        }
    }
    public fListLit(l: P.ListLit) {
        this.fWs(l.wsa);
        this.pr("[");
        if (l.els) {
            this.fCSArgs(l.els);
        }
        this.fWs(l.wsb);
        this.pr("]");
    }
    public fCSArgs(csa: P.CSArgs) {
        this.fExpr(csa.head);
        for (const t of csa.tail) {
            this.fWs(t.ws);
            this.pr(",", "p");
            this.fExpr(t.exp);
        }
    }
    public fCSIDs(csids: P.CSIDs) {
        this.fID(csids.head);
        for (const id of csids.tail) {
            this.fWs(id.ws);
            this.pr(",", "p");
            this.fID(id.id);
        }
    }
    public fID(id: P.ID) {
        this.fWs(id.ws);
        this.pr(id.id, "n");
    }
    public fBool(b: P.Bool) {
        this.fWs(b.ws);
        this.pr((b.bool === "fior" || b.bool === "fíor") ? "fíor" : "bréag", "m");
    }
    public fNeamhni(n: P.Neamhni) {
        this.fWs(n.ws);
        this.pr(`neamhní`, "l");
    }
    public fInt(i: P.Int) {
        this.fWs(i.ws);
        this.pr(`${i.int}`, "m");
    }
    public fLit(lit: P.Litreacha) {
        this.fWs(lit.ws);
        this.pr(`'${lit.val}'`, "s");
    }
    public fWs(w: P._, force: boolean = false) {
        for (const sp of w.sp) {
            if (sp.length > 0 && sp[0] === ">") { // Comment
                this.pr(sp, "c");
            } else {
                this.pr(sp);
            }
        }
    }

    private pr(s: string, cls?: string) {
        if (cls) {
            this.out.push(`<span class="${cls}">${escape(s)}</span>`);
        } else {
            this.out.push(escape(s));
        }
    }
}

export function format(s: string): string {
    const parser = new P.Parser(s);
    const result = parser.parse();
    if (result.err) {
        throw result.err;
    }
    const f = new Formatter();
    return `<div class="highlighter-rouge">
<div class="highlight">
<pre class="highlight"><code>${f.format(result.ast!)}</code></pre>
</div>
</div>`;
}
