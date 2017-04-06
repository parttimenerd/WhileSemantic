/* Source: http://stackoverflow.com/a/36644558 */
Object.entries = typeof Object.entries === 'function' ? Object.entries : obj => Object.keys(obj).map(k => [k, obj[k]]);

/** Abstract AST visitor */
class Visitor {

    defaultVisit(obj){
        return null
    }

    /** @param {Bool} bool */
    visitBool(bool){
        return this.defaultVisit(bool)
    }

    /** @param {Num} number */
    visitNum(number){
        return this.defaultVisit(number)
    }

    /**
     *
     * @param {Var} _var
     */
    visitVar(_var){
        return this.defaultVisit(_var)
    }

    /**
     *
     * @param {BinaryBexp} bexp
     */
    visitBinaryBexp(bexp){
       return this.defaultVisit(bexp);
    }

    /**
     *
     * @param {BinaryAexp} aexp
     */
    visitBinaryAexp(aexp){
        return this.defaultVisit(aexp);
    }

    /**
     *
     * @param {Mul} mul
     */
    visitMul(mul){
        return this.defaultVisit(mul)
    }

    /**
     *
     * @param {LowerEquals} _le
     */
    visitLowerEquals(_le){
        return this.defaultVisit(_le)
    }

    /**
     *
     * @param {Not} not
     */
    visitNot(not){
        return this.defaultVisit(not)
    }

    /**
     *
     * @param {And} and
     */
    visitAnd(and){
        return this.defaultVisit(and)
    }

    /**
     *
     * @param {Skip} skip
     */
    visitSkip(skip){
        return this.defaultVisit(skip)
    }

    /**
     *
     * @param {Ass} ass
     */
    visitAss(ass){
        return this.defaultVisit(ass)
    }

    /**
     *
     * @param {LocalAss} ass
     */
    visitLocalAss(ass){
        return this.defaultVisit(ass)
    }

    /**
     *
     * @param seq
     */
    visitSeq(seq){
        return this.defaultVisit(seq)
    }

    /**
     *
     * @param {If} _if
     */
    visitIf(_if){
        return this.defaultVisit(_if)
    }

    /**
     *
     * @param {While} _while
     */
    visitWhile(_while){
       return this.defaultVisit(_while)
    }
}

function prettyPrint(obj) {
    return obj.toHTML();
}

function arithmeticValue(aexp, context) {
    return aexp.eval(context);
}

/**
 *
 * @param {Bexp} bexp
 * @param {Context} context
 * @return {Bool}
 */
function booleanValue(bexp, context) {
    if (!(bexp instanceof Bexp)){
        throw "not an Bexp"
    }
    return bexp.eval(context);
}

__max_id = 0;

class ASTNode {

    constructor(){
        this._id = __max_id++;
    }

    /** @return {String} */
    toHTML(){
        console.error("not implemented");
        return "<nothing>"
    }

    /** @param {Visitor} visitor */
    visit(visitor){
        throw "undefined"
    }

    /**
     * @return {String}
     */
    toLaTex(){
        return this.toHTML();
    }

    /**
     * Wraps all nodes that are in the passed list
     * Returns the wrapped version.
     *
     * @param {Number[]} nodesToWrapIds
     * @param {Function<ASTNode, ASTNode>} wrapper
     * @return {ASTNode}
     */
    wrapNodes(nodesToWrap, wrapper){
        return this._wrapNodes(Array.from(nodesToWrap.map(x => x._id)), wrapper);
    }

    _wrapNodes(nodesToWrapIds, wrapper){
        if (nodesToWrapIds.includes(this._id)){
            return wrapper(this);
        }
        return this;
    }

    _wrapNodesHelper(nodesToWrapIds, wrapper, children, constructor, additionalParams = []){
        let wrappedChildren = [];
        for (let obj of children) {
            wrappedChildren.push(obj._wrapNodes(nodesToWrapIds, wrapper));
        }
        let args = [null].concat(wrappedChildren).concat(additionalParams);
        let newSelf = new (Function.prototype.bind.apply(constructor, args));
        newSelf._id = this._id;
        if (nodesToWrapIds.includes(this._id)) {
            return wrapper(newSelf);
        }
        return newSelf;
    }
}

class Expression extends ASTNode {
}


class HighlightNode extends ASTNode {
    constructor(node, _htmlClass = "highlight"){
        super();
        this.node = node;
        this.htmlClass = _htmlClass;
    }
    toHTML(){
        return `<span class="${this.htmlClass}">${this.node.toHTML()}</span>`
    }
    toLaTex(){
        return this.node.toLaTex();
    }
    eval(_context=null){
        return this.node.eval(_context);
    }

    _wrapNodes(nodesToWrapIds, wrapper) {
        return this._wrapNodesHelper(nodesToWrapIds, wrapper, [this.node], HighlightNode, [this.htmlClass]);
    }


    visit(visitor) {
        return this.node.visit(visitor);
    }
}

class Aexp extends Expression {

    /**
     * @param {Context} context
     * @return {Num}
     */
    eval(context){

    }

    /**
     * @return {String}
     */
    toLaTex(){
        return this.toHTML();
    }
}

class Num extends Aexp {
    constructor(value){
        super();
        this.value = value;
    }

    toHTML(){
        return String(this.value);
    }

    visit(visitor){
        return visitor.visitNum(this)
    }

    eval(context){
        return this
    }
}

class ContextFactory {
    constructor(){
        this.maxId = 0
    }

    create(_map){
        let id = this.maxId;
        this.maxId++;
        return new Context(_map, id, this);
    }

    createFromString(str){
        let map = new Map();
        try {
            str.replace(/ /g, "").split(",").forEach(part => {
                if (part.length > 1) {
                    let subParts = part.split(/->|→|↦/);
                    map.set(subParts[0].trim(), Number(subParts[1].trim()));
                }
            });
        } catch (e){
            console.error(e);
            throw "Context string has invalid format";
        }
        return this.create(map)
    }
}

class Context {

    constructor(_map, id, factory){
        if (!(_map instanceof Map)){
            _map = new Map(Object.entries(_map))
        }
        this.map = new Map();
        for (let key of _map.keys()) {
            if (_map.get(key) instanceof Num) {
                this.map.set(key instanceof Var ? key.name : key, _map.get(key))
            } else {
                this.setValue(key, new Num(_map.get(key)))
            }
        }
        this.id = id;
        this.factory = factory;
    }

    /**
     *
     * @param {Var} _var
     * @return {Number}
     */
    getValue(_var){
        return this.map.get(_var instanceof Var ? _var.name : _var)
    }

    /**
     *
     * @param {Var|String} _var
     * @param value
     */
    setValue(_var, value){
        let varName = _var instanceof Var ? _var.name : _var;
        if (value === undefined){
            this.map.delete(varName);
        } else if (value instanceof Num) {
            this.map.set(varName, value)
        } else {
            this.setValue(_var, new Num(value))
        }
    }

    toHTML(){
        var strs = [];
        for (let key of this.map.keys()) {
            strs.push(`${key} ↦ ${this.map.get(key).toHTML()}`)
        }
        return `[${this.id}, ${strs.join(", ")}]`
    }

    toValueHTML(){
        let strs = [];
        for (let key of this.map.keys()) {
            strs.push(`${key} ↦ ${this.map.get(key).toHTML()}`)
        }
        return strs.length === 0 ? "&empty;" : strs.join(", ")
    }

    toShortString(){
        return `σ${this.id}`
    }

    get htmlClass(){
        return "context" + this.id;
    }

    toShortHTMLString(){
        return `<span class="context ${this.htmlClass} highlightable" onmouseleave="clearRule(); window.isContextUnderFocus = false; unhighlightElems('.${this.htmlClass}', 'highlight-context');" onmouseover="window.isContextUnderFocus = true; highlightElems('.${this.htmlClass}', 'highlight-context'); ${this.toDisplayJSCode()}"><var>σ</var>${this._subbedId()}</span>`
    }

    toShortHTMLStringWoJS(){
        return `<var>σ</var>${this._subbedId()}`
    }

    _subbedId(){
        return `<span class="sub">${this.id}</span>`
    }

    toLaTex(){
        return `\\sigma_${this.id}`
    }

    toLongLaTex(){
        return `${this.toLaTex()} = ${this.toValueLaTex()}`
    }

    toValueLaTex(){
        let strs = [];
        for (let key of this.map.keys()) {
            strs.push(`${key} \\\\mapsto ${this.map.get(key).toHTML()}`)
        }
        return strs.length === 0 ? "\\emptyset" : `[${strs.join(",~")}]`
    }

    toDisplayJSCode(){
        return `displayLaTex('${this.toLongLaTex().replace('\\', '\\\\')}')`
    }

    /**
     * Creates a copy and sets its var to the given value, returns it
     * @param _var
     * @param value
     * @param {ContextFactory} contextFactory
     * @return {Context}
     */
    setImm(_var, value, contextFactory=null) {
        let con = (contextFactory === null ? this.factory : contextFactory).create(new Map(this.map));
        con.setValue(_var, value);
        return con
    }

}

class Var extends Aexp {
    /**
     *
     * @param {String} name
     */
    constructor(name){
        super();
        this.name = name;
    }

    toHTML(){
        return this.name
    }
    visit(visitor){
        return visitor.visitVar(this);
    }

    eval(context){
        return context.getValue(this)
    }
}

class BinaryAexp extends Aexp {
    /**
     *
     * @param {Aexp} left
     * @param {Aexp} right
     */
    constructor(left, right){
        super();
        this.left = left;
        this.right = right;
    }

    /**
     * @return {String}
     */
    get operator(){
        return null
    }

    toHTML(){
        return `${this.left.toHTML()} ${this.operator} ${this.right.toHTML()}`
    }

    toLaTex(){
        return `${this.left.toLaTex()} ${this.operator} ${this.right.toLaTex()}`
    }

    visit(visitor){
        this.left.visit(visitor);
        this.right.visit(visitor);
        return visitor.visitBinaryAexp(this)
    }

    _wrapNodes(nodesToWrapIds, wrapper) {
        return super._wrapNodes(nodesToWrapIds, wrapper, [this.left, this.right], this.constructor);
    }
}

class Sub extends BinaryAexp {

    get operator(){
        return "-"
    }

    eval(context){
        return new Num(this.left.eval(context).value - this.right.eval(context).value);
    }
}

class Add extends BinaryAexp {
    get operator(){
        return "+"
    }

    eval(context){
        return new Num(this.left.eval(context).value + this.right.eval(context).value);
    }
}

class Mul extends BinaryAexp {

    get operator(){
        return "*"
    }

    eval(context){
        return new Num(this.left.eval(context).value * this.right.eval(context).value);
    }
}

class Div extends BinaryAexp {

    get operator(){
        return "/"
    }

    eval(context){
        return new Num(this.left.eval(context).value / this.right.eval(context).value);
    }
}

class SingleAexp extends Aexp {

    /**
     *
     * @param  {Aexp} expression
     */
    constructor(expression){
        super();
        this.expression = expression
    }

    toHTML(){
        return "(" + this.expression.toHTML() + ")"
    }

    toLaTex(){
        return "(" + this.expression.toLaTex() + ")"
    }

    visit(visitor){
        return this.expression.visit(visitor);
    }

    eval(context){
        return this.expression.eval(context);
    }

    _wrapNodes(nodesToWrapIds, wrapper) {
        return super._wrapNodes(nodesToWrapIds, wrapper, [this.expression], this.constructor);
    }
}

class Bexp extends Expression {
    /**
     *
     * @param {Context} context
     */
    eval(context){
        throw "not yet implemented";
    }
}

class BinaryBexp extends Bexp {
    /**
     *
     * @param {Aexp} left
     * @param {Aexp} right
     */
    constructor(left, right){
        super();
        this.left = left;
        this.right = right;
    }

    /**
     * @return {String}
     */
    get operator(){
        return null
    }

    toHTML(){
        return `${this.left.toHTML()} ${this.operator.replace(/</g, "&lt;").replace(/>/g, "&gt;")} ${this.right.toHTML()}`
    }

    toLaTex(){
        return `${this.left.toLaTex()}~${this.operator.replace(/&/g, "\\&")}~${this.right.toLaTex()}`
    }

    visit(visitor){
        this.left.visit(visitor);
        this.right.visit(visitor);
        return visitor.visitBinaryBexp(this);
    }
}

class Bool extends Bexp {

    constructor(bool){
        super();
        this.value = bool;
    }

    toHTML(){
        return String(this.value)
    }

    visit(visitor){
        return visitor.visitBool(this)
    }

    eval(context){
        return this;
    }
}

class LowerEquals extends BinaryBexp {
    get operator(){
        return "<="
    }

    eval(context){
        return new Bool(this.left.eval(context).value <= this.right.eval(context).value);
    }
}

class Lower extends BinaryBexp {
    get operator(){
        return "<"
    }

    eval(context){
        return new Bool(this.left.eval(context).value < this.right.eval(context).value);
    }
}

class GreaterEquals extends BinaryBexp {
    get operator(){
        return ">="
    }

    eval(context){
        return new Bool(this.left.eval(context).value > this.right.eval(context).value);
    }
}

class Greater extends BinaryBexp {
    get operator(){
        return ">"
    }

    eval(context){
        return new Bool(this.left.eval(context).value > this.right.eval(context).value);
    }
}

class UnEquals extends BinaryBexp {
    get operator(){
        return "!="
    }

    eval(context){
        return new Bool(this.left.eval(context).value !== this.right.eval(context).value);
    }
}

class Equals extends BinaryBexp {
    get operator(){
        return "=="
    }

    eval(context){
        return new Bool(this.left.eval(context).value === this.right.eval(context).value);
    }
}

class Not extends Bexp {

    /**
     *
     * @param  {Bexp} expression
     */
    constructor(expression){
        super();
        this.expression = expression
    }

    toHTML(){
        return "not " + this.expression.toHTML()
    }

    toLaTex(){
        return "not " + this.expression.toLaTex();
    }

    visit(visitor){
        this.expression.visit(visitor);
        return visitor.visitNot(this)
    }

    eval(context){
        return new Bool(!this.expression.eval(context).value);
    }
}

class SingleBexp extends Bexp {

    /**
     *
     * @param  {Bexp} expression
     */
    constructor(expression){
        super();
        this.expression = expression
    }

    toHTML(){
        return "(" + this.expression.toHTML() + ")"
    }

    toLaTex(){
        return "(" + this.expression.toLaTex() + ")"
    }

    visit(visitor){
        return this.expression.visit(visitor);
    }

    eval(context){
        return this.expression.eval(context);
    }

    _wrapNodes(nodesToWrapIds, wrapper) {
        return super._wrapNodes(nodesToWrapIds, wrapper, [this.expression], this.constructor);
    }
}

class And extends BinaryBexp {

    get operator(){
        return "&&"
    }

    eval(context){
        return new Bool(this.left.eval(context).value && this.right.eval(context).value);
    }
}

class Or extends BinaryBexp {

    get operator(){
        return "||"
    }

    eval(context){
        return new Bool(this.left.eval(context).value || this.right.eval(context).value);
    }
}

function shouldComBeWrappedInParentheses(com){
    return com instanceof Seq || com instanceof If || com instanceof While;
}

class Com extends ASTNode {

    constructor(){
        super();
    }

    /** @param {Com} com */
    _comToHTML(com){
        if (shouldComBeWrappedInParentheses(com)){
            return "(" + com.toHTML() + ")";
        }
        return com.toHTML();
    }

    /** @param {Com} com */
    _comToLaTex(com){
        if (shouldComBeWrappedInParentheses(com)){
            return "(" + com.toLaTex() + ")";
        }
        return com.toLaTex();
    }
}

class Skip extends Com {

    constructor(){
        super();
    }

    toHTML(){
        return "skip"
    }

    visit(visitor){
        return visitor.visitSkip()
    }
}

class Ass extends Com {
    /**
     *
     * @param {Var} _var
     * @param {Aexp} expr
     */
    constructor(_var, expr){
        super();
        this.var = _var;
        this.expr = expr;
    }

    toHTML(){
        return `${this.var.name} := ${this.expr.toHTML()}`
    }

    toLaTex(){
        return `${this.var.name} := ${this.expr.toLaTex()}`
    }

    visit(visitor){
        this.var.visit(visitor);
        this.expr.visit(visitor);
        return visitor.visitAss(this)
    }


    _wrapNodes(nodesToWrapIds, wrapper) {
        return this._wrapNodesHelper(nodesToWrapIds, wrapper, [this.var, this.expr], Ass);
    }
}

class LocalAss extends Com {
    /**
     *
     * @param {Var} _var
     * @param {Aexp} expr
     * @param {Com} com
     */
    constructor(_var, expr, com){
        super();
        this.var = _var;
        this.expr = expr;
        this.com = com;
    }

    toHTML(){
        return `{var ${this.var.name} = ${this.expr.toHTML()}; ${this.com.toHTML()}}`
    }

    toLaTex(){
        return `\\{var ${this.var.name} = ${this.expr.toLaTex()}; ${this.com.toLaTex()}\\}`
    }

    visit(visitor){
        this.var.visit(visitor);
        this.expr.visit(visitor);
        this.com.visit(visitor);
        return visitor.visitLocalAss(this)
    }

    _wrapNodes(nodesToWrapIds, wrapper) {
        return this._wrapNodesHelper(nodesToWrapIds, wrapper, [this.var, this.expr, this.com], LocalAss);
    }
}

class Seq extends Com {
    /**
     *
     * @param {Com} com1
     * @param {Com} com2
     */
    constructor(com1, com2){
        super();
        this.com1 = com1;
        this.com2 = com2;
    }

    toHTML(){
        return `${this.com1.toHTML()}; ${this.com2.toHTML()}`
    }

    toLaTex(){
        return `${this.com1.toLaTex()}; ${this.com2.toLaTex()}`
    }

    visit(visitor){
        this.com1.visit(visitor);
        this.com2.visit(visitor);
        return visitor.visitSeq(this);
    }

    _wrapNodes(nodesToWrapIds, wrapper) {
        return this._wrapNodesHelper(nodesToWrapIds, wrapper, [this.com1, this.com2], Seq);
    }
}

/**
 * Allows to have of notion of parantheses in the AST
 */
class SingleCom extends Com {
    /**
     *
     * @param {Com} com
     */
    constructor(com){
        super();
        this.com = com;
    }

    toHTML(){
        if (shouldComBeWrappedInParentheses(this.com)) {
            return `(${this.com.toHTML()})`
        }
        return this.com.toHTML();
    }

    toLaTex(){
        if (shouldComBeWrappedInParentheses(this.com)) {
            return `(${this.com.toLaTex()})`
        }
        return this.com.toLaTex();
    }

    visit(visitor){
        return this.com.visit(visitor);
    }

    _wrapNodes(nodesToWrapIds, wrapper) {
        return this._wrapNodesHelper(nodesToWrapIds, wrapper, [this.com], SingleCom);
    }
}

class If extends Com {
    /**
     *
     * @param {Bexp} cond condition
     * @param {Com} com1 true branch
     * @param {Com} com2 false branch
     */
    constructor(cond, com1, com2){
        super();
        this.cond = cond;
        this.com1 = com1;
        this.com2 = com2;
    }

    toHTML(){
        return `if (${this.cond.toHTML()}) then ${this._comToHTML(this.com1)} else ${this._comToHTML(this.com2)}`
    }

    toLaTex(){
        return `if (${this.cond.toLaTex()}) then ${this._comToLaTex(this.com1)} else ${this._comToLaTex(this.com2)}`
    }

    visit(visitor){
        this.cond.visit(visitor);
        this.com1.visit(visitor);
        this.com2.visit(visitor);
        return visitor.visitIf(this);
    }

    _wrapNodes(nodesToWrapIds, wrapper) {
        return this._wrapNodesHelper(nodesToWrapIds, wrapper, [this.cond, this.com1, this.com2], If);
    }
}

class While extends Com {
    /**
     *
     * @param {Bexp} cond
     * @param {Com} body
     */
    constructor(cond, body){
       super();
       this.cond = cond;
       this.body = body;
    }

    toHTML(){
        return `while (${this.cond.toHTML()}) do ${this._comToHTML(this.body)}`
    }

    toLaTex(){
        console.log(this.cond.toLaTex())
        return `while (${this.cond.toLaTex()}) do ${this._comToLaTex(this.body)}`
    }

    visit(visitor){
        this.cond.visit(visitor);
        this.body.visit(visitor);
        return visitor.visitWhile(this)
    }

    _wrapNodes(nodesToWrapIds, wrapper) {
        return this._wrapNodesHelper(nodesToWrapIds, wrapper, [this.cond, this.body], While);
    }
}

_evalLineMaxId = 0;

class EvalLine {

    constructor(){
        this.id = _evalLineMaxId++;
    }

    get htmlId(){
        return "line" + this.id;
    }

    toString(){}

    toHTML(){}
}

/**
 * A part of an evaluation that is equivalent to `B[b]\sigma = [boolean value]`
 */
class BoolEvalLine extends EvalLine {
    /**
     *
     * @param {Bexp} bexpr
     * @param {Bool} expValue
     * @param {Context} context
     */
    constructor(bexpr, expValue, context){
        super();
        this.bexpr = bexpr;
        this.expValue = expValue instanceof Bool ? expValue : new Bool(expValue);
        this.context = context;
    }

    toString(){
        return `<span id="${this.htmlId}">B[<code>${this.bexpr.toHTML()}</code>] ${this.context.toShortHTMLString()} = ${this.expValue.toHTML()}</span>`
    }

    toHTML(){
        return this.toString();
    }
}

/**
 * A part of an evaluation that is equivalent to `\sigma_i = \sigma_j [var -> value]`
 */
class AssActualValueEvalLine extends EvalLine {
    /**
     * @param {Context} context1
     * @param {Context} context2
     * @param {Var} _var
     * @param {Num} value
     */
    constructor(context1, context2, _var, value){
        super();
        this.context1 = context1;
        this.context2 = context2;
        this.var = _var;
        this.value = value
    }

    toString(){
        return `<span id="${this.htmlId}">${this.context2.toShortHTMLString()} = ${this.context1.toShortHTMLString()}[${this.var.toHTML()} ↦ ${this.value.toHTML()}]</span>`
    }

    toHTML(){
        return this.toString();
    }
}

/**
 * A line of a big step semantic evaluation
 * i.e. <c, \sigma> ↓ \sigma'
 * it tells us for a given start state \sigma and a given program c that a possible end state is \sigma'
 *
 * the endState may me omitted, thus the class is usable for the small step and the big step semantic
 */
class ComEvalLine extends EvalLine {

    /**
     *
     * @param {Com} program
     * @param {Context} startState
     * @param {Context} endState
     * @param {Com} _actualCom
     */
    constructor(program, startState, endState = null, _actualCom = null, _displayCom = null){
        super();
        this.program = program;
        this.startState = startState;
        this.endState = endState;
        this.actualCom = _actualCom;
        this.displayCom = _displayCom === null ? this.program : _displayCom;
    }

    copy(){
        return new ComEvalLine(this.program, this.startState, this.endState, this.actualCom, this.displayCom);
    }

    toHTML(){
        let ret = `〈<code>${this.displayCom.toHTML()}</code>, ${this.startState.toShortHTMLString()}〉`
        if (this.endState instanceof Context) {
            return `${ret} ⇓ ${this.endState.toShortHTMLString()}`
        }
        return `<span id="${this.htmlId}">${ret}</span>`;
    }
}

class Rule {
    constructor(name, formula, instantiations){
        this.name = name;
        this.formula = formula;
        this.instantiations = instantiations;
    }

    toString(){
        return this.name
    }
}

class RuleApplication {
    constructor(ruleId, instantiations){
        this.ruleId = ruleId;
        this.instantiations = instantiations;
    }

    toInstantiatedLaTexArr(){
        return [`\\text{${this.toString()}}: ${rules[this.ruleId].formula}`,
            `${this.instantiations.map(x => `${x[0]} \\equiv ${x[1]}`).join(",~")}`]
    }

    toCallJS(){
        return `displayRule(new RuleApplication("${this.ruleId}", ${JSON.stringify(this.instantiations)}))`;
    }

    toString(){
        return rules[this.ruleId].toString();
    }
}

rules = {};

var __random_num = 10;

/**
 * A big step semantic evaluation step
 * e.g.
 *      A  B
 * Rule ----
 *       C
 */
class EvalStep {
    /**
     *
     * @param {RuleApplication} appliedRule
     * @param {EvalLine} currentEvalLine
     * @param {EvalStep[]} resultingSteps
     */
    constructor(appliedRule, currentEvalLine, resultingSteps = []){
        this.appliedRule = appliedRule;
        this.currentEvalLine = currentEvalLine;
        this.resultingSteps = resultingSteps.map(x => x instanceof EvalStep ? x : new EvalStep(new Rule(""), x, []))
    }

    copy(){
        return new EvalStep(this.appliedRule, this.currentEvalLine.copy(), new Array(this.resultingSteps.map(x => x.copy())));
    }

    toHTML(_prevHTMLId=-1) {
        __random_num += 1;
        let id = __random_num;
        let eventHandlers = "";
        const cssLineClass = `bs_line_${this.currentEvalLine.htmlId}`;
        if (this.appliedRule instanceof RuleApplication) {
        eval(`     window.stepFunc${id} = function() {
${this.appliedRule.toCallJS()};
};`);
            const highlightIds = ["'" + this.currentEvalLine.htmlId + "'"];
            if (_prevHTMLId !== -1){
                highlightIds.push("'" + _prevHTMLId + "'");
            }
            const onmouseleave = `clearRule(); unhighlightPrevAndCur(${highlightIds.join(",")}); unhighlightElems('.${cssLineClass}');`;
            const onmouseover = `if (!window.isContextUnderFocus) {window.stepFunc${id}(); highlightPrevAndCur(${highlightIds.join(",")}); highlightElems('.${cssLineClass}');}`;
            eventHandlers = `onmouseleave="${onmouseleave}" onmouseover="${onmouseover}"`;
        } else {
        }
        return `
<table style="margin: 0 auto;">
    <tr>
        ${this.resultingSteps.length > 0 ? this.resultingSteps.map(x => `<td>${x.toHTML(this.currentEvalLine.htmlId)}</td>`).join("") : "<td></td>"}
        <td class="rulename" rowspan="2"><div class="rulename" ${eventHandlers}>${this.appliedRule.toString()}</div></td></tr>
    <tr><td class="${!(this.currentEvalLine instanceof  ComEvalLine) ? "" : "conc"} ${cssLineClass}" colspan="${Math.max(1, this.resultingSteps.length)}" ${eventHandlers}><span class="${cssLineClass}">${this.currentEvalLine.toHTML()}</span></td></tr>
</table>
`
    }
}

rules["maxSteps"] = new Rule("MaxSteps", "\\text{Executed the maximum number of steps}");
function ac(f, s, sigmaApp, doVerb=true){
    return `\\langle ${doVerb ? verb(f) : f}, \\sigma ${s} \\rangle \\Downarrow \\sigma ${sigmaApp}`
}
function verb(s){
    return `\\mathtt{${s.replace(/ /g, "~")}}`
}
rules["Skip"] = new Rule("Skip", `${ac("skip", "", "")}`);
rules["Ass"] = new Rule("Ass", `${ac("x := a", "", "")} [x \\mapsto A [ a ] \\sigma ]`);
rules["Seq"] = new Rule("Seq",`\\frac{ ${ac("c_0", "", "'")} \\qquad ${ac("c_1", "'", "' '")}}{${ac("c_0;c_1", "", "''")}}`);
rules["IfTT"] = new Rule("IfTT", `\\frac{\\mathcal{B}[b] \\sigma = \\mathtt{tt} \\qquad ${ac("c_0", "", "'")}}{${ac("\\mathtt{if ~(} b \\mathtt{)~then }~ c_0~ \\mathtt{else} ~c_1", "", "'", false)}}`)
rules["IfFF"] = new Rule("IfFF", `\\frac{\\mathcal{B}[b] \\sigma = \\mathtt{ff} \\qquad ${ac("c_1", "", "'")}}{${ac("\\mathtt{if ~(} b \\mathtt{)~then }~ c_0~ \\mathtt{else} ~c_1", "", "'", false)}}`)
rules["WhileFF"] = new Rule("WhileFF", `\\frac{\\mathcal{B}[b] \\sigma = \\mathtt{ff}}{${ac("\\mathtt{while~(} b \\mathtt{)~do~} c", "", "", false)}}`);
rules["WhileTT"] = new Rule("WhileTT", `\\frac{\\mathcal{B}[b] \\sigma = \\mathtt{tt} \\qquad ${ac("c", "", "'")} \\qquad ${ac("\\mathtt{while~(} b \\mathtt{)~do~} c", "'", "''", false)}}{${ac("\\mathtt{while~(} b \\mathtt{)~do~} c", "", "''", false)}}`);
rules["Block"] = new Rule("Block", `\\frac{ ${ac("c", "[x \\mapsto \\mathcal{A}[a]\\sigma]", "'")} }{${ac("\\mathtt{\{~var~} x \\mathtt{~=~} a \\mathtt{;~}c \\mathtt{~\}}", "", "'[x \\mapsto \\sigma(x)]", false)}}`);

class EvalBigSemantic {

    /**
     *
     * @param {Com} program
     * @param {Context} startContext
     * @param {Number} maxSteps
     */
    constructor(program, startContext, maxSteps = 100){
        this.program = program;
        this.evalLine = new ComEvalLine(program, startContext, null);
        this.startContext = startContext;
        this.maxSteps = maxSteps;
        this.steps = 0;
    }

    /** @return {EvalStep} */
    eval(){
        return this._dispatch(this.program, this.startContext)
    }

    /**
     *
     * @param {Com} com
     * @param {Context} startContext
     * @return {EvalStep}
     */
    _dispatch(com, startContext){
        if (this.maxSteps <= this.steps){
            console.error("Executed the maximum number of steps");
            return new EvalStep(new RuleApplication("maxSteps", []), new ComEvalLine(com, startContext, startContext));
        }
        this.steps +=1;
        let funcs = {
            "Skip": this._visitSkip,
            "Seq": this._visitSeq,
            "Ass": this._visitAss,
            "LocalAss": this._visitLocalAss,
            "If": this._visitIf,
            "While": this._visitWhile,
            "SingleCom": this._visitSingleCom
        };
        return funcs[com.constructor.name].apply(this, [com, startContext])
    }

    /**
     * @param {Skip} com
     * @param {Context} startContext
     * @return {EvalStep} */
    _visitSkip(com, startContext){
        return new EvalStep(new RuleApplication("Skip", []), new ComEvalLine(com, startContext, startContext));
    }

    /**
     * @param {Ass} com
     * @param {Context} startContext
     * @return {EvalStep}
     */
    _visitAss(com, startContext){
        let newCon = startContext.setImm(com.var, arithmeticValue(com.expr, startContext));
        return new EvalStep(
            new RuleApplication("Ass",
                [["x", com.var.name],
                ["a", verb(com.expr.toLaTex())],
                ["\\sigma", startContext.toLaTex()]]),
            new ComEvalLine(com, startContext, newCon), [
                new AssActualValueEvalLine(startContext, newCon, com.var, newCon.getValue(com.var))])
    }

    /**
     * @param {Seq} com
     * @param {Context} startContext
     * @return {EvalStep}
     */
    _visitSeq(com, startContext){
        let sigma_ = startContext;
        let com1Line = this._dispatch(com.com1, startContext);
        let com2Line = this._dispatch(com.com2, com1Line.currentEvalLine.endState);
        var endContext = com2Line.currentEvalLine.endState;
        return new EvalStep(
            new RuleApplication("Seq", [["c_0", verb(com.com1.toLaTex())], ["c_1", verb(com.com2.toLaTex())],
                                        ["\\sigma", startContext.toLaTex()],
                                        ["\\sigma'", com1Line.currentEvalLine.endState.toLaTex()],
                                        ["\\sigma''", com2Line.currentEvalLine.endState.toLaTex()]]),
            new ComEvalLine(com, startContext, endContext), [com1Line, com2Line]);
    }

    /**
     * @param {If} com
     * @param {Context} startContext
     * @return {EvalStep}
     */
    _visitIf(com, startContext){
        let condVal = booleanValue(com.cond, startContext).value;
        let boolLine = new BoolEvalLine(com.cond, new Bool(condVal), startContext);
        let chosenCom = condVal ? com.com1 : com.com2;
        let chosenComLine = this._dispatch(chosenCom, startContext);
        let rule = new Rule(condVal ? "IfTT" : "IfFF");
        return new EvalStep(new RuleApplication(rule, [["c_0", verb(com.com1.toLaTex())], ["c_1", verb(com.com2.toLaTex())],
                ["\\sigma", startContext.toLaTex()],
                ["\\sigma'", chosenComLine.currentEvalLine.endState.toLaTex()]]),
            new ComEvalLine(com, startContext, chosenComLine.currentEvalLine.endState), [boolLine, chosenComLine])
    }

    /**
     * @param {While} com
     * @param {Context} startContext
     * @return {EvalStep}
     */
    _visitWhile(com, startContext){
        let condVal = booleanValue(com.cond, startContext).value;
        let boolLine = new BoolEvalLine(com.cond, new Bool(condVal), startContext);
        let chosenCom = condVal ? com.com1 : com.com2;
        let rule = new Rule(condVal ? "WhileTT" : "WhileFF");
        if (condVal){
            let firstBodyEval = this._dispatch(com.body, startContext);
            let nextWhileEval = this._dispatch(com, firstBodyEval.currentEvalLine.endState);
            return new EvalStep(new RuleApplication("WhileTT",
                    [["b", verb(com.cond.toLaTex())], ["c", verb(com.body.toLaTex())], ["\\sigma", startContext.toLaTex()],
                    ["\\sigma'", firstBodyEval.currentEvalLine.endState.toLaTex()],
                    ["\\sigma''", nextWhileEval.currentEvalLine.endState.toLaTex()]]),
                new ComEvalLine(com, startContext, nextWhileEval.currentEvalLine.endState), [boolLine, firstBodyEval, nextWhileEval]);
        } else {
            return new EvalStep(new RuleApplication("WhileFF",
                [["b", verb(com.cond.toLaTex())], ["c", verb(com.body.toLaTex())], ["\\sigma", startContext.toLaTex()]]),
                new ComEvalLine(com, startContext, startContext), [boolLine]);
        }
        //return new EvalStep(rule, new ComEvalLine(com, startContext, chosenComLine.currentEvalLine.endState), [boolLine, chosenComLine]);
    }

    /**
     * @param {LocalAss} com
     * @param {Context} startContext
     * @return {EvalStep}
     */
    _visitLocalAss(com, startContext){
        let sigma_ = startContext;
        let oldVal = startContext.getValue(com.var);
        let newContext = startContext.setImm(com.var, arithmeticValue(com.expr, startContext));
        let comLine = this._dispatch(com.com, newContext);
        let endContext = comLine.currentEvalLine.endState.setImm(com.var, oldVal);
        return new EvalStep(
            new RuleApplication("Block",
                [["x", com.var.name], ["a", verb(com.expr.toLaTex())],
                 ["c", verb(com.com.toLaTex())],
                 ["\\sigma", startContext.toLaTex()],
                 ["\\sigma'", newContext.toLaTex()]]),
            new ComEvalLine(com, startContext, endContext), [comLine]);
    }

    /**
     * @param {LocalAss} com
     * @param {Context} startContext
     * @return {EvalStep}
     */
    _visitSingleCom(com, startContext){
        return this._dispatch(com.com, startContext);
    }
}

function highlightElems(selector, cssClass="highlight-visible"){
    $(selector).addClass(cssClass);
}

function unhighlightElems(selector, cssClass="highlight-visible"){
    $(selector).removeClass(cssClass);
}

/**
 * Highlight the nodes with "highlight" or "highlight-prev" classes that belong to the elements whichs ids are passed.
 */
function highlightPrevAndCur(curId, prevId = null) {
    if (prevId !== null) {
        $(`#${prevId}`).find(".highlight-prev").addClass("highlight-prev-visible");
    }
    $(`#${curId}`).find(".highlight").addClass("highlight-visible");
}

function unhighlightPrevAndCur(curId, prevId = null) {
    if (prevId !== null) {
        $(`#${prevId}`).find(".highlight-prev").removeClass("highlight-prev-visible");
    }
    $(`#${curId}`).find(".highlight").removeClass("highlight-visible");
}


_step_max_id = 0;

/**
 * A small step semantic evaluation step
 * e.g.
 *  →_1 A
 */
class SSEvalStep {
    /**
     *
     * @param {RuleApplication} appliedRule
     * @param {ComEvalLine} currentEvalLine
     * @param {Boolean} maxStepsReached
     */
    constructor(appliedRule, currentEvalLine, maxStepsReached = false){
        this.appliedRule = appliedRule;
        this.currentEvalLine = currentEvalLine;
        this.maxStepsReached = maxStepsReached;
        this.id = _step_max_id++;
    }

    copy(){
        return new SSEvalStep(this.appliedRule, this.currentEvalLine.copy(), this.maxStepsReached);
    }

    toHTML(_prevHTMLId=-1) {
        __random_num += 1;
        let id = __random_num;
        if (this.appliedRule instanceof RuleApplication) {
            eval(`     window.stepFunc${id} = function() {
${this.appliedRule.toCallJS()};
};`);
        }
        const highlightIds = ["'" + this.currentEvalLine.htmlId + "'"];
        if (_prevHTMLId !== -1){
            highlightIds.push("'" + _prevHTMLId + "'");
        }
        return `
    <div class="ss_step" onmouseleave="clearRule(); unhighlightPrevAndCur(${highlightIds.join(",")});" onmouseover="if (!window.isContextUnderFocus) {window.stepFunc${id}(); highlightPrevAndCur(${highlightIds.join(",")});}">
        <span class="ss_arrow">→<span class="sub">1</span></span>
        <span class="ss_eval_line">
            ${this.maxStepsReached ? `… maximum number of steps reached ` : this.currentEvalLine.toHTML()}
        </span>
    </div>`
    }
}

class SSEvalSteps {
    /**
     *
     * @param {ComEvalLine} startLine
     * @param {SSEvalStep[]} steps
     */
    constructor(startLine, steps = []) {
        this.startLine = startLine;
        this.steps = steps;
    }

    addStep(step) {
        this.steps.push(step);
    }

    toHTML() {
        let tableLines = [];
        if (this.steps.length === 0) {
            tableLines.push([this.startLine.toHTML(), ""])
        } else {
            tableLines.push([this.startLine.toHTML(), this.steps[0].toHTML(this.startLine.htmlId)]);
            for (let i = 1; i < this.steps.length; i++) {
                tableLines.push(["", this.steps[i].toHTML(this.steps[i-1].currentEvalLine.htmlId)]);
            }
        }
        return `
<table class="ss_eval_steps">
    ${tableLines.map(x => `<tr><td class="ss_first_col">${x[0]}</td><td class="ss_step_col">${x[1]}</td></tr>`).join("\n")}
</table>`
    }

    /** @return {ComEvalLine} */
    get endLine(){
        return this.steps.length === 0 ? this.startLine : this.steps[this.steps.length - 1].currentEvalLine;
    }

    /** @return {Context} */
    get endState() {
        return this.endLine.startState;
    }

    /** @return {Com} */
    get endCom(){
        return this.endLine.program;
    }
}

function acs(f, s, doVerb=true){
    return `\\langle ${doVerb ? verb(f) : f}, \\sigma ${s} \\rangle `
}
rules["SkipSS"] = new Rule("Skip", `${ac("skip", "", "")}`);//\\step ${acs("x \\mathtt{~=~} a \\mathtt{;~}c \\mathtt{;~} x \\mathtt{~=~} n", "", false)}
rules["AssSS"] = new Rule("Ass", `${acs("x := a", "")} [x \\mapsto A [ a ] \\sigma ]`);
rules["Seq1SS"] = new Rule("Seq1",`\\frac{ ${acs("c_0", "", false)} \\step ${acs("c_0'", "'", false)}}{${acs("c_0 \\mathtt{;~} c_1", "", false)} \\step ${acs("c_0' \\mathtt{;~} c_1", "", false)}}`);
rules["Seq2SS"] = new Rule("Seq2",`${acs("\\mathtt{skip;}~c", "", false)} \\step ${acs("c", "", false)}`);
rules["IfTTSS"] = new Rule("IfTT", `\\frac{\\mathcal{B}[b] \\sigma = \\mathtt{tt}}{${acs("\\mathtt{if ~(} b \\mathtt{)~then }~ c_0~ \\mathtt{else} ~c_1", "", false)} \\step ${acs("c_0", "", false)}}`);
rules["IfFFSS"] = new Rule("IfTT", `\\frac{\\mathcal{B}[b] \\sigma = \\mathtt{ff}}{${acs("\\mathtt{if ~(} b \\mathtt{)~then }~ c_0~ \\mathtt{else} ~c_1", "", false)} \\step ${acs("c_1", "", false)}}`);rules["WhileFFSS"] = new Rule("WhileFF", `\\frac{\\mathcal{B}[b] \\sigma = \\mathtt{ff}}{${ac("\\mathtt{while~(} b \\mathtt{)~do~} c", "", "", false)}}`);
rules["WhileSS"] = new Rule("While", `${acs("\\mathtt{while~(} b \\mathtt{)~do~} c", "", false)} ${acs("\\mathtt{if ~(} b \\mathtt{)~then~(}~c~\\mathtt{;~while~(} b \\mathtt{)~do~} c \\mathtt{)~else~skip}", "", false)}`);
rules["Block1SS"] = new Rule("Block1", `\\frac{\\forall a': [x \\mapsto a'] \\notin \\sigma}{${acs("\\mathtt{\\{~var~} x \\mathtt{~=~} a \\mathtt{;~}c \\mathtt{~\\}}", "", false)} \\step ${acs("x \\mathtt{~=~} a \\mathtt{;~}c", "", false)}}`);
rules["Block2SS"] = new Rule("Block2", `\\frac{\\exists a': [x \\mapsto a'] \\in \\sigma \\land \\mathcal{A}[a'] = n}{${acs("\\mathtt{\\{~var~} x \\mathtt{~=~} a \\mathtt{;~}c \\mathtt{~\\}}", "", false)} \\step ${acs("x \\mathtt{~=~} a \\mathtt{;~}c \\mathtt{;~} x \\mathtt{~=~} n", "", false)}}`);


/**
 * @param {Com} com
 */
function isSkip(com) {
    return com instanceof Skip;
}

class EvalSmallStepSemantic {

    /**
     *
     * @param {Com} program
     * @param {Context} startContext
     * @param {Number} maxSteps
     */
    constructor(program, startContext, maxSteps = 100){
        this.program = program;
        this.evalLine = new ComEvalLine(program, startContext, null, program);
        this.startContext = startContext;
        this.maxSteps = maxSteps;
        this.steps = 0;
        /**
         * Structure that capture all steps
         * @type {SSEvalSteps}
         */
        this.evalSteps = null
    }

    /** @return {SSEvalSteps} */
    eval(){
        this.evalSteps = new SSEvalSteps(new ComEvalLine(this.program, this.startContext));
        this._dispatch(this.program, this.startContext, x => x);
        return this.evalSteps;
    }

    /**
     *
     * @param {RuleApplication} appliedRule
     * @param {Com} actualCom
     * @param {ASTNode[]} highlightedNodes
     * @param {Context} context
     * @param {Function<Com, Com>} surround
     */
    _addStep(appliedRule, actualCom, highlightedNodes, context, surround) {
        let step = new SSEvalStep(appliedRule, new ComEvalLine(surround(actualCom), context, null, actualCom,
            surround(actualCom.wrapNodes(highlightedNodes, x => new HighlightNode(x)))));
        this.evalSteps.addStep(step);
    }

    _highlightPrev(nodes){
        let endLine = this.evalSteps.endLine;
        if (endLine !== undefined) {
            endLine.displayCom = endLine.displayCom.wrapNodes(nodes, x => new HighlightNode(x, "highlight-prev"));
        }
    }

    /**
     *
     * @param {Com} com
     * @param {Context} startContext
     * @param {Function<Com, Com>} surround
     */
    _dispatch(com, startContext, surround){
        if (isSkip(com)){
            return;
        }
        if (this.maxSteps <= this.steps){
            console.warn("Executed the maximum number of steps");
            this._addStep(new RuleApplication("maxSteps", []), new Skip(), [com], startContext, x => x);
            return;
        }
        this.steps +=1;
        let funcs = {
            "Skip": this._visitSkip,
            "Seq": this._visitSeq,
            "Ass": this._visitAss,
            "LocalAss": this._visitLocalAss,
            "If": this._visitIf,
            "While": this._visitWhile,
            "SingleCom": this._visitSingleCom
        };
        funcs[com.constructor.name].apply(this, [com, startContext, surround])
    }

    /**
     * @param {Skip} com
     * @param {Context} startContext
     * @param {Function<Com, Com>} surround
     */
    _visitSkip(com, startContext, surround){
    }

    /**
     * @param {Skip} com
     * @param {Context} startContext
     * @param {Function<Com, Com>} surround
     */
    _visitAss(com, startContext, surround){
        let newCon = startContext.setImm(com.var, arithmeticValue(com.expr, startContext));
        this._highlightPrev([com]);
        let newCom = new Skip();
        this._addStep(new RuleApplication("AssSS",
            [["x", com.var.name],
                ["a", verb(com.expr.toLaTex())],
                ["\\sigma", startContext.toLaTex()]]), newCom, [newCom], newCon, surround)
    }

    /**
     * @param {Seq} com
     * @param {Context} startContext
     * @param {Function<Com, Com>} surround
     */
    _visitSeq(com, startContext, surround){
        if (isSkip(com.com1)){ // Seq2
            this._highlightPrev([com.com2]);
            this._addStep(
                new RuleApplication("Seq2SS",
                    [["c", verb(com.com2.toLaTex())],
                    ["\\sigma", startContext.toLaTex()]]), com.com2, [com.com2], startContext, surround);

            this._dispatch(com.com2, startContext, surround);
        } else {
            this._dispatch(com.com1, this.evalSteps.endState, x => surround(new Seq(x, com.com2)));
            // TODO: should the Seq1SS rule really be omitted?
            /*
            this._highlightPrev([com.com2]);
            this._addStep(
                new RuleApplication("Seq1SS", [
                        ["c_0", verb(com.com1.toLaTex())],
                        ["c_1", verb(com.com2.toLaTex())],
                        ["\\sigma", startContext.toLaTex()],
                        ["c_0''", this.evalSteps.endLine.actualCom.toLaTex()],
                        ["\\sigma'", this.evalSteps.endState.toLaTex()]]),
                com.com2, [com.com2], this.evalSteps.endState, surround);
            */
            //if (isSkip(com.com2)){
            //    this._dispatch(com.com2, this.evalSteps.endState, surround);
            //} else {
                this._dispatch(new Seq(new Skip(), com.com2), this.evalSteps.endState, surround);
            //}
        }
    }

    /**
     * @param {If} com
     * @param {Context} startContext
     * @param {Function<Com, Com>} surround
     */
    _visitIf(com, startContext, surround){
        let condVal = booleanValue(com.cond, startContext).value;
        let chosenCom = condVal ? com.com1 : com.com2;
        this._highlightPrev([com.cond, chosenCom]);
        let rule = new Rule(condVal ? "IfTTSS" : "IfFFSS");
        this._addStep(new RuleApplication(rule,
                [["c_0", verb(com.com1.toLaTex())], ["c_1", verb(com.com2.toLaTex())],
                 ["\\sigma", startContext.toLaTex()]]),
                chosenCom, [chosenCom], startContext, surround);
        this._dispatch(chosenCom, startContext, surround);
    }

    /**
     * @param {While} com
     * @param {Context} startContext
     * @param {Function<Com, Com>} surround
     */
    _visitWhile(com, startContext, surround){
        let newCom = new If(com.cond, new Seq(com.body, com), new Skip());
        this._highlightPrev([com]);
        this._addStep(new RuleApplication("WhileSS",
            [["b", com.cond.toLaTex()], ["c", verb(com.body.toLaTex())], ["\\sigma", startContext.toLaTex()]]),
            newCom, [newCom], startContext, surround);
        this._dispatch(newCom, startContext, surround);
    }

    /**
     * @param {LocalAss} com
     * @param {Context} startContext
     * @param {Function<Com, Com>} surround
     */
    _visitLocalAss(com, startContext, surround){
        this._highlightPrev([com]);
        let oldVal = startContext.getValue(com.var);
        var newCom;
        if (oldVal === undefined){
            newCom = new Seq(new Ass(com.var, com.expr), com.com);
            newCom = new Seq(new Ass(new HighlightNode(com.var), new HighlightNode(com.expr)), new HighlightNode(com.com));
            this._addStep(new RuleApplication("Block1SS",
                [["x", com.var.name], ["a", com.expr.toLaTex()], ["c", com.com.toLaTex()]], ["\\sigma", startContext.toLaTex()]),
                newCom, [newCom], startContext, surround);
        } else {
            newCom = new Seq(new Seq(new Ass(com.var, com.expr), com.com), new Ass(com.var, oldVal));
            this._addStep(new RuleApplication("Block2SS",
                [["x", com.var.name], ["a", com.expr.toLaTex()], ["c", com.com.toLaTex()],  ["\\sigma", startContext.toLaTex()], ["n", oldVal.toLaTex()]]),
                newCom, [newCom], startContext, surround);
        }
        this._dispatch(newCom, startContext, surround);
    }

    /**
     * @param {Seq} com
     * @param {Context} startContext
     * @param {Function<Com, Com>} surround
     */
    _visitSingleCom(com, startContext, surround){
        return this._dispatch(com.com, startContext, x => new SingleCom(surround(x)));
    }
}