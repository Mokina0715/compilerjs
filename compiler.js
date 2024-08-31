function lexicalAnalysis(code) {
    const tokenDefinitions = [
        { regex: /\b(let|const|var|if|else)\b/, type: 'palabra clave' },
        { regex: /^[a-zA-Z_]\w*/, type: 'identificador' }, // Identificador que inicia con letras o _
        { regex: /^\d+(\.\d+)?\b(?!\w)/, type: 'número' },  // Número que no es seguido por letras (no identificador)
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
            const unrecognizedToken = code[position];
            return { error: `Error léxico: Token no reconocido "${unrecognizedToken}" en la posición ${position}` };
        }
    }
    return { tokens };
}


function syntaxAnalysis(tokens) {
    let i = 0;

    while (i < tokens.length) {
        const currentToken = tokens[i];

        // Verificar la estructura de las asignaciones
        if (currentToken.type === 'identificador') {
            if (tokens[i + 1]?.token !== '=') {
                return `Error sintáctico: Se esperaba '=' después de '${currentToken.token}' en la posición ${i + 1}`;
            }

            if (tokens[i + 2]?.type !== 'identificador' && tokens[i + 2]?.type !== 'número' && tokens[i + 2]?.type !== 'cadena de texto') {
                return `Error sintáctico: Se esperaba un valor válido después de '=' en la posición ${i + 2}`;
            }

            // Saltar sobre la expresión de asignación válida
            i += 3;
            continue;
        }
        i++;
    }

    return "El orden de los tokens es válido";
}

function semanticAnalysis(tokens) {
    let variables = {}; // Guardar el tipo de cada variable
    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].token === "let" || tokens[i].token === "const" || tokens[i].token === "var") {
            let variableName = tokens[i + 1].token;
            variables[variableName] = "variable";
        }

        if (tokens[i].token === "=") {
            let leftVar = variables[tokens[i - 1]?.token];
            let rightVar = tokens[i + 1]?.token;

            // Verificar si la variable fue declarada
            if (!leftVar) {
                return `Error semántico: Variable no declarada '${tokens[i - 1].token}'`;
            }

            // Verifica si el valor a la derecha de la asignación es una variable no declarada
            if (variables[rightVar] === undefined && tokens[i + 1].type === 'identificador') {
                return `Error semántico: Variable no declarada '${rightVar}'`;
            }
        }
    }
    return "Todos los tipos de variables son correctos";
}


function analyzeCode() {
    const code = document.getElementById("code").value;
    const lexicalResult = lexicalAnalysis(code);

    if (lexicalResult.error) {
        document.getElementById("lexical-result").textContent = lexicalResult.error;
        document.getElementById("syntax-result").textContent = "";
        document.getElementById("semantic-result").textContent = "";
        return;
    }

    const tokens = lexicalResult.tokens;
    let tokens_text = '<br>';
    tokens.forEach(function (token) {
        tokens_text += `${token.type}: ${token.token} <br>`;
    });

    document.getElementById("lexical-result").innerHTML = tokens_text;

    const syntaxResult = syntaxAnalysis(tokens);
    if (syntaxResult.startsWith("Error")) {
        document.getElementById("syntax-result").textContent = syntaxResult;
        document.getElementById("semantic-result").textContent = "";
        return;
    }
    document.getElementById("syntax-result").textContent = syntaxResult;

    const semanticResult = semanticAnalysis(tokens);
    document.getElementById("semantic-result").textContent = semanticResult;
}
