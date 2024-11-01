function lexicalAnalysis(code) {
    const tokenDefinitions = [
        { regex: /\b(let|const|var|if|else)\b/, type: 'palabra clave' },
        { regex: /^-?\d+(\.\d+)?\b(?!\w)/, type: 'número' },  // Números, incluyendo negativos
        { regex: /^[a-zA-Z_]\w*/, type: 'identificador' }, // Identificador
        { regex: /=/, type: 'asignación' },
        { regex: /[+\-*/]/, type: 'operador' },
        { regex: /[;]/, type: 'punto y coma' },
        { regex: /[,]/, type: 'coma' },
        { regex: /[\[\]]/, type: 'corchete' },
        { regex: /[\{\}]/, type: 'llave' },
        { regex: /[()]/, type: 'paréntesis' },
        { regex: /\"[^\"]*\"|\'[^\']*\'/, type: 'cadena de texto' }
    ];

    const tokens = [];
    const errors = [];
    let position = 0;

    while (position < code.length) {
        let matchFound = false;

        // Ignorar espacios en blanco
        if (/\s/.test(code[position])) {
            position++;
            continue;
        }

        for (const { regex, type } of tokenDefinitions) {
            const match = code.slice(position).match(regex);
            if (match && match.index === 0) {
                tokens.push({ token: match[0], type });
                position += match[0].length;
                matchFound = true;
                break;
            }
        }

        if (!matchFound) {
            errors.push(`Error léxico: Token no reconocido "${code[position]}" en la posición ${position}`);
            position++; // Avanza a la siguiente posición para continuar
        }
    }

    return errors.length > 0 ? { errors } : { tokens };
}


function syntaxAnalysis(tokens) {
    let i = 0;
    let braceCounter = 0;

    while (i < tokens.length) {
        const currentToken = tokens[i];

        // Verificación de estructura en declaraciones de variables
        if (currentToken.token === 'let' || currentToken.token === 'const' || currentToken.token === 'var') {
            if (tokens[i + 1]?.type !== 'identificador') {
                return `Error sintáctico: Se esperaba un identificador después de '${currentToken.token}' en la posición ${i + 1}`;
            }
            if (tokens[i + 2]?.token !== '=') {
                return `Error sintáctico: Se esperaba '=' después de '${tokens[i + 1]?.token}' en la posición ${i + 2}`;
            }
        }

        // Identificador aislado sin una declaración o asignación
        if (currentToken.type === 'identificador' && !['let', 'const', 'var', '='].includes(tokens[i - 1]?.token)) {
            return `Error sintáctico: Declaración incompleta o aislada del identificador '${currentToken.token}' en la posición ${i}`;
        }

        if (currentToken.token === '{') braceCounter++;
        if (currentToken.token === '}') braceCounter--;

        if (braceCounter < 0) return `Error sintáctico: Llave de cierre inesperada en la posición ${i}`;
        i++;
    }

    if (braceCounter !== 0) return `Error sintáctico: Llave de cierre faltante`;
    return "El orden de los tokens es válido";
}




function semanticAnalysis(tokens) {
    const variables = {};

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (['let', 'const', 'var'].includes(token.token)) {
            const variableName = tokens[i + 1]?.token;
            const variableType = token.token;

            if (variables[variableName]) {
                return `Error semántico: Variable "${variableName}" ya declarada en la posición ${i}`;
            }
            variables[variableName] = variableType;
        }

        if (token.token === '=') {
            const leftVar = tokens[i - 1]?.token;
            const rightVarType = variables[tokens[i + 1]?.token];

            if (variables[leftVar] && rightVarType && variables[leftVar] !== rightVarType) {
                return `Error semántico: No se puede reasignar el tipo de "${leftVar}" a ${rightVarType}`;
            }
        }

        if (['+', '-', '*', '/'].includes(token.token)) {
            const leftType = variables[tokens[i - 1]?.token];
            const rightType = variables[tokens[i + 1]?.token];
            if (leftType === 'array' || rightType === 'array') {
                return `Error semántico: No se pueden realizar operaciones aritméticas con arreglos.`;
            }
        }
    }
    return "Todos los tipos de variables son correctos";
}


function analyzeCode() {
    const code = document.getElementById("code").value;
    const lexicalResult = lexicalAnalysis(code);

    if (lexicalResult.errors) {
        showLexicalResult(lexicalResult);
        clearSyntaxAndSemanticResults();
        return;
    }

    showLexicalResult(lexicalResult);

    const syntaxResult = syntaxAnalysis(lexicalResult.tokens);
    if (syntaxResult.startsWith("Error")) {
        showSyntaxResult(syntaxResult);
        clearSemanticResults();
        return;
    }

    showSyntaxResult(syntaxResult);

    const semanticResult = semanticAnalysis(lexicalResult.tokens);
    showSemanticResult(semanticResult);
}

function clearSyntaxAndSemanticResults() {
    document.getElementById("syntax-result").textContent = "";
    document.getElementById("semantic-result").textContent = "";
}

function clearSemanticResults() {
    document.getElementById("semantic-result").textContent = "";
}

function showLexicalResult(result) {
    const resultElement = document.getElementById("lexical-result");
    if (result.errors) {
        resultElement.innerHTML = result.errors.map(error => `<span class="error">❌ ${error}</span>`).join('<br>');
    } else {
        resultElement.innerHTML = `<span class="success">✔️ Análisis Léxico completado sin errores.</span><br>`;
        result.tokens.forEach(token => {
            resultElement.innerHTML += `${token.type}: ${token.token} <br>`;
        });
    }
}


function showSyntaxResult(result) {
    const resultElement = document.getElementById("syntax-result");
    if (result.startsWith("Error")) {
        resultElement.innerHTML = `<span class="error">❌ ${result}</span>`;
    } else {
        resultElement.innerHTML = `<span class="success">✔️ ${result}</span>`;
    }
}

function showSemanticResult(result) {
    const resultElement = document.getElementById("semantic-result");
    if (result.startsWith("Error")) {
        resultElement.innerHTML = `<span class="error">❌ ${result}</span>`;
    } else {
        resultElement.innerHTML = `<span class="success">✔️ ${result}</span>`;
    }
}
