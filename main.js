let globalQVector = null;
let globalZVector = null;
let globalAVector = null;
let globalMatrix = {};

class Quintupla{
    constructor(data) {
        this.data = data.split('\n').map(line => line.trim()).filter(line => line !== '');
        this.patterns = {
            Q: /^Q=\{([A-Za-z0-9]+,)*[A-Za-z0-9]+\}$/, 
            Z: /^Z=\{([A-Za-z0-9]+,)*[A-Za-z0-9]+\}$/, 
            i: /^i=[A-Za-z0-9]+$/, 
            A: /^A=\{([A-Za-z0-9]+,)*[A-Za-z0-9]+\}$/, 
            w: /^w=\{(\([A-Za-z0-9]+,[A-Za-z0-9]+,[A-Za-z0-9]+\)(;)?)+\}$/
        };
        this.Q_vector = null;
        this.Z_vector = null;
        this.A_vector = null;
        this.w_transitions = null;
    }
    
    validate() {
        const expectedKeys = Object.keys(this.patterns);
        const errorMessages = []; 
        if (this.data.length !== expectedKeys.length) {
            return ['Número de líneas incorrecto.'];
        }
    
        for (let i = 0; i < expectedKeys.length; i++) {
            const key = expectedKeys[i];
            const regex = this.patterns[key];
            if (!regex.test(this.data[i])) {
                errorMessages.push(`Error en la línea ${i + 1}: "${this.data[i]}"`); 
            }
        }
    
        const qLine = this.data[0]; 
        const iLine = this.data[2];
        const aLine = this.data[3];
        const wLine = this.data[4]; 
    
        // Extraer estados de Q y A
        const statesQ = qLine.match(/[A-Za-z0-9]+/g) || []; 
        const stateI = iLine.split('=')[1].trim(); 
    
        // Verificación de estado inicial i
        if (!statesQ.includes(stateI)) {
            errorMessages.push(`Error en la línea 3: El estado "${stateI}" en "i" no existe en Q.`);
        }
    
        // Verificar estados en A contra Q
        // const statesA = aLine.match(/[A-Za-z0-9]+/g) || []; 
    
        // statesA.forEach(state => {
        //     if (!statesQ.includes(state)) {
        //         errorMessages.push(`Error en la línea 4: El estado "${state}" en "A" no existe en Q.`);
        //     }
        // });
    
        const transitions = wLine.match(/\(([^)]+)\)/g);
        const zLine = this.data[1]; 
        const alphabet = zLine.match(/[A-Za-z0-9]+/g);
    
        if (transitions) {
            transitions.forEach(transition => {
                const [stateFrom, symbol, stateTo] = transition.replace(/[()]/g, '').split(',');
                
                if (!statesQ.includes(stateFrom.trim())) {
                    errorMessages.push(`Error en w: El estado "${stateFrom.trim()}" no está en Q.`);
                }
    
                if (!alphabet.includes(symbol.trim())) {
                    errorMessages.push(`Error en w: El símbolo "${symbol.trim()}" no está en Z.`);
                }
    
                if (!statesQ.includes(stateTo.trim())) {
                    errorMessages.push(`Error en w: El estado "${stateTo.trim()}" no está en Q.`);
                }
            });
        }
      if(errorMessages.length === 0){
        this.parseVectors();
        this.parseMatriz();
      }
      
    
    //   console.log('validate ');
    //   console.log(errorMessages.length);
      return errorMessages.length >= 0 ? errorMessages : ['El archivo tiene una estructura válida.'];
  }
  
  parseVectors(){
    // extraemos la informaicon
    const Q_data = this.data.find(line => line.startsWith('Q=')).split('=')[1];
    const Z_data = this.data.find(line => line.startsWith('Z=')).split('=')[1];
    const A_data = this.data.find(line => line.startsWith('A=')).split('=')[1];
   
    this.Q_vector = new Vector(Q_data);
    this.Z_vector = new Vector(Z_data);
    this.A_vector = new Vector(A_data);
    
    // console.log('Antes de pasar a la matriz')
    // console.log(this.w_transitions);
    globalQVector = this.Q_vector.getElements();
    globalZVector = this.Z_vector.getElements();
    globalAVector = this.A_vector.getElements();
    //  console.log("Conjunto Q:", this.Q_vector.getElements()); // ["A", "B"]
    //  console.log("Conjunto Z:", this.Z_vector.getElements()); // ["a", "b"]
    //  console.log("Conjunto A:", this.A_vector.getElements()); // ["B"]
  }

  transformarTransiciones(obj) {
    const transiciones = [];
    
    for (const estadoInicial in obj) {
        for (const letra in obj[estadoInicial]) {
            const estadosFinales = obj[estadoInicial][letra];

            estadosFinales.forEach(estadoFinal => {
                transiciones.push([estadoInicial, letra, estadoFinal]);
            });
        }
    }

    return transiciones;
}
  parseMatriz() {
    globalMatrix = {}; // Limpiamos la matriz global antes de agregar nueva información
    const w_data = this.data.find(line => line.startsWith('w=')).split('=')[1];
    this.w_transitions = w_data;

    
    // Remover los corchetes y dividir las transiciones por punto y coma
    const transiciones = this.w_transitions.replace(/[{}]/g, '').split(';');
  

    transiciones.forEach(transicion => {
        const [estadoOrigen, letra, estadoDestino] = transicion.split(',');

        // Eliminar paréntesis de los estados
        const origenSinParentesis = estadoOrigen.replace(/[\(\)]/g, '').trim();
        const destinoSinParentesis = estadoDestino.replace(/[\(\)]/g, '').trim();

        if (!globalMatrix[origenSinParentesis]) {
            globalMatrix[origenSinParentesis] = {};
        }

        if (!globalMatrix[origenSinParentesis][letra]) {
            globalMatrix[origenSinParentesis][letra] = [];
        }
        
        // Agregar el estado destino a la matriz (soporta múltiples destinos)
        globalMatrix[origenSinParentesis][letra].push(destinoSinParentesis);
        console.log(globalMatrix);
    });
    // console.log("Matriz de transiciones global:", globalMatrix);
    // console.log('DATA')
    // console.log(w_data);
    const convertTransitions = this.transformarTransiciones(globalMatrix);
    // console.log(convertTransitions);

    this.w_transitions  = new Automata(convertTransitions);
    this.w_transitions.generarTabla();

}

}

class Arrastrar_Soltar {
  constructor(dragAreaId, fileInputId, fileInfoId, fileContentId, ) {
      this.dragArea = document.getElementById(dragAreaId);
      this.fileInput = document.getElementById(fileInputId);
      this.fileInfo = document.getElementById(fileInfoId);
      this.fileContent = document.getElementById(fileContentId);
      //this.validationResult = document.getElementById(validationResultId);
      this.seEstaArrastrandoAdentro = false;
      this.initGlobalEvents();
      this.initDragEvents();
      this.initClickEvent();
  }

  initGlobalEvents() {
      document.addEventListener('dragover', (event) => {
          event.preventDefault();
          if (!this.seEstaArrastrandoAdentro) {
              event.dataTransfer.dropEffect = 'none'; // Mostrar ícono de restringido
          }
      });

      document.addEventListener('drop', (event) => {
          event.preventDefault();
      });
  }

  initDragEvents() {
      this.dragArea.addEventListener('dragover', (event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'copy';
          this.seEstaArrastrandoAdentro = true;
          this.dragArea.classList.add('dragover');
      });

      this.dragArea.addEventListener('dragleave', () => {
          this.seEstaArrastrandoAdentro = false;
          this.dragArea.classList.remove('dragover');
      });

      this.dragArea.addEventListener('drop', (event) => {
          event.preventDefault();
          this.dragArea.classList.remove('dragover');
          this.seEstaArrastrandoAdentro = false;
          const files = event.dataTransfer.files;

          if(files.length>1){
            alert('Solo se Permite agregar un archivo a la vez. Por favor vuelva a intentarlo');
            return
          }
          
          const file = files[0];
          this.handleFile(file);

      });
  }

  initClickEvent() {
      this.dragArea.addEventListener('click', () => {
          this.fileInput.click();
      });

      this.fileInput.addEventListener('change', (event) => {
          const file = event.target.files[0];
          this.handleFile(file);
      });
  }

  handleFile(file) {
      if (this.validateFile(file)) {
          //this.displayFileInfo(file);
          this.readFileContent(file);
      } else {
          alert('Por favor, selecciona un archivo .txt válido.');
      }
  }
  showVectorAndMatriz(){

    modal.style.display = "block";

    // Limpia el contenido anterior
    tableBody.innerHTML = '';

    // Agrega los vectores a la tabla en el formato de la imagen
    if (globalQVector && globalZVector && globalAVector) {
        let rows = Math.max(globalQVector.length, globalZVector.length, globalAVector.length);

        // Encabezados de las columnas
        //tableBody.innerHTML = `<thead><tr><th>Q</th><th>Σ</th><th>A</th></tr></thead>`;

        // Añadir filas con los valores de los vectores
        for (let i = 0; i < rows; i++) {
            let qVal = globalQVector[i] || ''; // Si no hay más valores, deja la celda vacía
            let zVal = globalZVector[i] || '';
            let aVal = globalAVector[i] || '';
            tableBody.innerHTML += `<tbody class="vector-cell"><tr><td>${qVal}</td><td class="vector-cell">${zVal}</td><td>${aVal}</td class="vector-cell"></tr></tbody>`;
        }
    } else {
        tableBody.innerHTML = '<tbody><tr><td colspan="3">No hay datos disponibles</td></tr></tbody>';
    }
  }

  validateFile(file) {
      const allowedExtension = ".txt";
      const fileExtension = file.name.split('.').pop();
      return fileExtension === allowedExtension.substring(1);
  }

  displayFileInfo(file) {
      this.fileInfo.textContent = `Nombre del archivo: ${file.name} | Tipo: ${file.type || 'desconocido'}`;
  }

  readFileContent(file) {
      const reader = new FileReader();
      reader.onload = (event) => {
          const content = event.target.result;
          //this.fileContent.textContent = content;
          const errors = this.validateQuintuple(content);
        //   console.log(errors.length);
          if(errors.length === 0){
            this.fileContent.textContent = content;
            this.showVectorAndMatriz();
            // btnOpenModal.style.display = 'block';
            
          }else{
            this.fileContent.textContent = `${errors.join(', ')}`;
            modal.style.display = "none";

          }
        
      };
      reader.readAsText(file);
  }

  validateQuintuple(content) {
      const validator = new Quintupla(content);
      const validationMessages = validator.validate();
      //this.validationResult.innerHTML = validationMessages.join('<br>'); // Muestra todos los mensajes
      if(validationMessages === true){
        return []
      }else{
        return validationMessages;
      }
  }
}

class Vector {
    constructor(dataString) {
      this.elements = this.parseData(dataString);
    }
  
    // Método para convertir el string en un array
    parseData(dataString) {
      return dataString.replace(/\{|\}/g, '').split(',').map(element => element.trim());
    }
  
    // Método para obtener los elementos
    getElements() {
      return this.elements;
    }
  
    // Método para agregar elementos al vector
    addElement(element) {
      if (!this.elements.includes(element)) {
        this.elements.push(element);
      }
    }
  
    // Método para mostrar el vector como string
    toString() {
      return `{${this.elements.join(', ')}}`;
    }
  }
  

// Inicializar la funcionalidad de arrastrar, soltar y seleccionar archivos
const dragAndDrop = new Arrastrar_Soltar('drag-area', 'file-input', 'file-info', 'file-content');
// Obtén referencias a los elementos del modal y al botón
const modal = document.getElementById("myModal");
const btnOpenModal = document.getElementById("openModal");
const span = document.getElementsByClassName("close")[0];
const tableBody = document.querySelector("tbody");

class Automata {
    constructor(transiciones) {
        this.transiciones = transiciones;
        this.estados = new Set();  // Conjunto para almacenar estados únicos
        this.alfabeto = new Set(); // Conjunto para almacenar letras del alfabeto
        this.matrizTransiciones = {}; // Objeto para almacenar transiciones
    }


    // Método para procesar las transiciones y generar los estados y el alfabeto
    procesarTransiciones() {
        this.transiciones.forEach((transicion) => {
            const [estadoInicial, letra, estadoFinal] = transicion;

            this.estados.add(estadoInicial);
            this.estados.add(estadoFinal);
            this.alfabeto.add(letra);

            // Crear o actualizar la matriz de transiciones
            if (!this.matrizTransiciones[estadoInicial]) {
                this.matrizTransiciones[estadoInicial] = {};
            }
            if (!this.matrizTransiciones[estadoInicial][letra]) {
                this.matrizTransiciones[estadoInicial][letra] = new Set();
            }

            // Añadir el estado final al conjunto correspondiente
            this.matrizTransiciones[estadoInicial][letra].add(estadoFinal);
        });
        // console.log(this.matrizTransiciones)
    }

    // Método para generar la tabla de transiciones dinámicamente
    generarTabla() {
        const tablaMatriz = document.getElementById('tablaMatriz'); // Select the table
        tablaMatriz.innerHTML = ''; // Clear the table
    
        this.procesarTransiciones(); // Process data to generate state sets and alphabet
    
        const estadosArray = Array.from(this.estados);
        const alfabetoArray = Array.from(this.alfabeto);
        const estadosVector = globalZVector;
        const alfabetoVector = globalQVector;

        // Create header row
        let headerRow = '<tr><th>Estado</th>';
        estadosVector.forEach(letra => {
            headerRow += `<th>${letra}</th>`;
        });
        headerRow += '</tr>';
        tablaMatriz.innerHTML += headerRow;
    
        // Create rows for each state
        alfabetoVector.forEach(estado => {
            let row = `<tr><td>${estado}</td>`;
            estadosVector.forEach(letra => {
                const destinos = this.matrizTransiciones[estado]?.[letra] || new Set();
                row += `<td>${destinos.size > 0 ? Array.from(destinos).sort().join(',') : ''}</td>`;
                // const destinosOrdenados = Array.from(destinos).sort().join(', ');
                // row += `<td>${destinosOrdenados}</td>`;
            });
            row += '</tr>';
            tablaMatriz.innerHTML += row;
        });
    }
    
}







