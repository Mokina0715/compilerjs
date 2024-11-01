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

        // Verificación para palabras clave `if`, `while`
        if (currentToken.type === 'palabra clave' && ['if', 'while'].includes(currentToken.token)) {
            // Verificación específica para estructura de control de flujo
            if (tokens[i + 1]?.token !== '(') {
                return `Error sintáctico: Se esperaba '(' después de '${currentToken.token}' en la posición ${i + 1}`;
            }
            if (tokens[i + 2]?.type !== 'identificador' && tokens[i + 2]?.type !== 'número') {
                return `Error sintáctico: Se esperaba un identificador o número después de '(' en la posición ${i + 2}`;
            }
            if (!['==', '===', '>=', '<=', '>', '<'].includes(tokens[i + 3]?.token)) {
                return `Error sintáctico: Se esperaba un operador de comparación en la posición ${i + 3}`;
            }
            if (tokens[i + 4]?.type !== 'identificador' && tokens[i + 4]?.type !== 'número') {
                return `Error sintáctico: Se esperaba un identificador o número después de la comparación en la posición ${i + 4}`;
            }
            if (tokens[i + 5]?.token !== ')') {
                return `Error sintáctico: Se esperaba ')' después de la condición en la posición ${i + 5}`;
            }
            if (tokens[i + 6]?.token !== '{') {
                return `Error sintáctico: Se esperaba '{' después de ')' en la posición ${i + 6}`;
            }
            const closingBraceIndex = tokens.findIndex((t, idx) => idx > i + 6 && t.token === '}');
            if (closingBraceIndex === -1) {
                return `Error sintáctico: Se esperaba '}' para cerrar el bloque en la posición ${i + 6}`;
            }
            i = closingBraceIndex;
            continue;
        }

        // Verificación para declaraciones de variables (`let`, `const`, `var`)
        if (['let', 'const', 'var'].includes(currentToken.token)) {
            let j = i + 1;

            // Procesar una lista de variables declaradas (múltiples o únicas)
            let expectingCommaOrEnd = false; // Bandera para verificar el final de una declaración múltiple
            while (tokens[j] && tokens[j].token !== ';') {
                if (tokens[j].type === 'identificador') {
                    // Si se espera `,` o `;` y encontramos un identificador, hay un error
                    if (expectingCommaOrEnd) {
                        return `Error sintáctico: Se esperaba ',' o ';' en la posición ${j}`;
                    }
                    expectingCommaOrEnd = true; // Después de un identificador, esperar `,` o `=`
                } else if (tokens[j].token === ',') {
                    // Si encontramos `,`, se espera otro identificador
                    if (!expectingCommaOrEnd) {
                        return `Error sintáctico: Se esperaba un identificador antes de ',' en la posición ${j}`;
                    }
                    expectingCommaOrEnd = false;
                } else if (tokens[j].token === '=') {
                    // Si encontramos `=`, verificar inicialización de una única variable
                    if (!expectingCommaOrEnd || tokens[j - 1].type !== 'identificador') {
                        return `Error sintáctico: Asignación inválida en la posición ${j}`;
                    }
                    // Verificar que después de `=` haya un número o identificador
                    if (tokens[j + 1]?.type !== 'número' && tokens[j + 1]?.type !== 'identificador') {
                        return `Error sintáctico: Se esperaba un valor después de '=' en la posición ${j + 1}`;
                    }
                    j++; // Salta el valor después de `=`
                    expectingCommaOrEnd = true;
                } else {
                    return `Error sintáctico: Token inesperado '${tokens[j].token}' en la posición ${j}`;
                }
                j++;
            }

            // Si se espera `;` al final de una declaración y no está presente
            if (expectingCommaOrEnd && tokens[j]?.token !== ';') {
                return `Error sintáctico: Se esperaba ';' al final de la declaración en la posición ${j}`;
            }

            i = j; // Avanza el índice hasta el `;`
            continue;
        }

        // Validación de asignaciones (`x = 5;`)
        if (currentToken.token === '=' && tokens[i - 1]?.type !== 'identificador') {
            return `Error sintáctico: Asignación inválida en la posición ${i}`;
        }

        // Validación para operadores de comparación (`==`, `===`, `>=`, `<=`)
        if (['==', '===', '>=', '<=', '>', '<'].includes(currentToken.token)) {
            if (tokens[i - 1]?.type !== 'identificador' && tokens[i - 1]?.type !== 'número') {
                return `Error sintáctico: Comparación inválida antes de '${currentToken.token}' en la posición ${i}`;
            }
            if (tokens[i + 1]?.type !== 'identificador' && tokens[i + 1]?.type !== 'número') {
                return `Error sintáctico: Comparación inválida después de '${currentToken.token}' en la posición ${i}`;
            }
        }

        // Validación para operadores aritméticos (`+`, `-`, `*`, `/`)
        if (['+', '-', '*', '/'].includes(currentToken.token)) {
            if (tokens[i - 1]?.type !== 'identificador' && tokens[i - 1]?.type !== 'número') {
                return `Error sintáctico: Operando inválido antes de '${currentToken.token}' en la posición ${i}`;
            }
            if (tokens[i + 1]?.type !== 'identificador' && tokens[i + 1]?.type !== 'número') {
                return `Error sintáctico: Operando inválido después de '${currentToken.token}' en la posición ${i}`;
            }
        }

        i++;
    }

    return "El orden de los tokens es válido";
}


function semanticAnalysis(tokens) {
    let variables = {}; // Guardar el tipo de cada variable
    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].token === "let" || tokens[i].token === "const" || tokens[i].token === "var" || tokens[i].token === "int" || tokens[i].token === "char") {
            let variableName = tokens[i + 1].token;
            if (tokens[i].token === "char" && tokens[i + 2]?.token === "[") {
                variables[variableName] = "array";
            } else if (/^[0-9]+$/.test(tokens[i + 3]?.token)) {
                variables[variableName] = "number";
            } else {
                variables[variableName] = tokens[i].token;
            }
        }

        if (tokens[i].token === "=" || tokens[i].token === "+" || tokens[i].token === "-" || tokens[i].token === "*" || tokens[i].token === "/") {
            let leftVar = variables[tokens[i - 1].token];
            let rightVar = variables[tokens[i + 1].token];

            // Si se detecta una operación con variables de tipos diferentes
            if (leftVar && rightVar && leftVar !== rightVar) {
                return `Error semántico: No se puede realizar la operación entre ${leftVar} y ${rightVar}`;
            }

            // Verifica si el tipo es incorrecto para la operación
            if (leftVar === "array" || rightVar === "array") {
                return `Error semántico: No se pueden realizar operaciones aritméticas con arreglos.`;
            }
        }
    }
    return "Todos los tipos de variables son correctos";
}

function analyzeCode() {
    const code = document.getElementById("code").value;
    const lexicalResult = lexicalAnalysis(code);

    if (lexicalResult.error) {
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
    if (result.error) {
        resultElement.innerHTML = `<span class="error">❌ ${result.error}</span>`;
    } else {
        resultElement.innerHTML = `<span class="success">✔️ Análisis Léxico completado sin errores.</span><br>`;
        result.tokens.forEach(function (token) {
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
