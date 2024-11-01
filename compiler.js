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
    const variables = {}; // Almacena el estado de las variables: {nombre: {declarada: true, inicializada: true/false}}

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        // Manejar declaraciones de variables (`let`, `const`, `var`)
        if (['let', 'const', 'var'].includes(token.token)) {
            let j = i + 1;
            let isMultipleDeclaration = false;

            // Revisar hasta el final de la declaración (`;`)
            while (tokens[j] && tokens[j].token !== ';') {
                if (tokens[j].type === 'identificador') {
                    // Si la variable ya está declarada, lanzar error de doble declaración
                    if (variables.hasOwnProperty(tokens[j].token)) {
                        return `Error semántico: Variable "${tokens[j].token}" ya declarada en la posición ${j}`;
                    }
                    // Registrar la variable como declarada, pero aún no inicializada
                    variables[tokens[j].token] = { declarada: true, inicializada: false };
                    
                    // Comprobar si es una declaración múltiple
                    if (tokens[j + 1]?.token === ',') {
                        isMultipleDeclaration = true;
                    }
                }
                j++;
            }

            // Validar si se detecta una declaración de variables múltiple o única
            if (isMultipleDeclaration) {
                console.log("Declaración múltiple de variables detectada.");
            } else {
                console.log("Declaración única de variable detectada.");
            }

            i = j; // Salta el índice después de `;`
        }

        // Verificar asignaciones para inicializar variables
        if (token.token === '=') {
            const leftVar = tokens[i - 1]?.token;

            // Error si intenta inicializar una variable no declarada
            if (!variables[leftVar]?.declarada) {
                return `Error semántico: Variable "${leftVar}" no declarada en la posición ${i - 1}`;
            }

            // Marcar la variable como inicializada
            variables[leftVar].inicializada = true;

            // Verificar el lado derecho de la asignación si es un identificador
            const rightVar = tokens[i + 1]?.token;
            if (tokens[i + 1]?.type === 'identificador' && !variables[rightVar]?.declarada) {
                return `Error semántico: Variable "${rightVar}" no declarada en la posición ${i + 1}`;
            }
        }

        // Verificar el uso de variables en operaciones aritméticas
        if (['+', '-', '*', '/'].includes(token.token)) {
            const leftVar = tokens[i - 1]?.token;
            const rightVar = tokens[i + 1]?.token;

            // Error si intenta usar una variable no declarada o no inicializada
            if (tokens[i - 1]?.type === 'identificador' && (!variables[leftVar]?.declarada || !variables[leftVar].inicializada)) {
                return `Error semántico: Variable "${leftVar}" no inicializada en la posición ${i - 1}`;
            }
            if (tokens[i + 1]?.type === 'identificador' && (!variables[rightVar]?.declarada || !variables[rightVar].inicializada)) {
                return `Error semántico: Variable "${rightVar}" no inicializada en la posición ${i + 1}`;
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
