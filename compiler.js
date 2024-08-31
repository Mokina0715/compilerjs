function lexicalAnalysis(code) {
    const tokenDefinitions = [
        { regex: /\b(let|const|var|if|else)\b/, type: 'palabra clave' },
        { regex: /[a-zA-Z_]\w*/, type: 'identificador' },
        { regex: /\d+/, type: 'número' },
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

        if (currentToken.type === 'palabra clave') {
            if (currentToken.token === 'if') {
                // Verifica que el siguiente token sea un paréntesis de apertura
                if (tokens[i + 1]?.token !== '(') {
                    return `Error sintáctico: Se esperaba '(' después de 'if' en la posición ${i + 1}`;
                }

                // Verifica que el siguiente token después del paréntesis sea un identificador o número
                if (tokens[i + 2]?.type !== 'identificador' && tokens[i + 2]?.type !== 'número') {
                    return `Error sintáctico: Se esperaba un identificador o número después de '(' en la posición ${i + 2}`;
                }

                // Verifica que el siguiente token sea una comparación
                if (tokens[i + 3]?.token !== '=' && tokens[i + 4]?.type !== '=') {
                    return `Error sintáctico: Se esperaba '==' en la posición ${i + 3} ${i + 4}`;
                }

                // Verifica que el siguiente token después de '==' sea un identificador o número
                if (tokens[i + 5]?.type !== 'número') {
                    return `Error sintáctico: Se esperaba un número después de '==' en la posición ${i + 5}`;
                }

                // Verifica que el siguiente token sea un paréntesis de cierre
                if (tokens[i + 6]?.token !== ')') {
                    return `Error sintáctico: Se esperaba ')' después de la condición en la posición ${i + 6}`;
                }

                // Verifica que el siguiente token sea una llave de apertura
                if (tokens[i + 7]?.token !== '{') {
                    return `Error sintáctico: Se esperaba '{' después de ')' en la posición ${i + 7}`;
                }

                // Verifica que la llave de cierre esté al final del bloque
                if (!tokens.some((t, index) => index > i + 7 && t.token === '}')) {
                    return `Error sintáctico: Se esperaba '}' para cerrar el bloque en la posición ${i + 7}`;
                }

                i += 7; // Avanza el índice para saltar la estructura completa del `if`
                continue; // Continua con la siguiente iteración del bucle
            }
        } else if (currentToken.token === '=' && tokens[i - 1]?.type !== 'identificador') {
            return `Error sintáctico: Asignación inválida en la posición ${i}`;
        } else if (currentToken.token === '==' || currentToken.token === '===' || currentToken.token === '>=' || currentToken.token === '<=') {
            if (tokens[i - 1]?.type !== 'identificador' && tokens[i - 1]?.type !== 'número') {
                return `Error sintáctico: Comparación inválida antes de '${currentToken.token}' en la posición ${i}`;
            }
            if (tokens[i + 1]?.type !== 'identificador' && tokens[i + 1]?.type !== 'número') {
                return `Error sintáctico: Comparación inválida después de '${currentToken.token}' en la posición ${i}`;
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