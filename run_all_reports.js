const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 EJECUTANDO INFORMES SELECCIONADOS');
console.log('====================================\n');

// Crear directorios de salida si no existen
const outputDirs = [
  './outputs/distances', 
  './outputs/reports'
];

outputDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Creado directorio: ${dir}`);
  }
});

// Función para ejecutar un script y manejar errores
function runScript(scriptName, description) {
  console.log(`\n📊 ${description}`);
  console.log('='.repeat(50));
  
  try {
    const startTime = Date.now();
    execSync(`node ${scriptName}`, { stdio: 'inherit' });
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.log(`✅ ${description} completado en ${duration}s`);
  } catch (error) {
    console.error(`❌ Error ejecutando ${scriptName}:`, error.message);
    return false;
  }
  return true;
}

// Ejecutar solo los scripts seleccionados
const scripts = [
  {
    name: 'all_shops_distances.js', 
    description: 'ANÁLISIS DE DISTANCIAS PARA TODAS LAS TIENDAS'
  }
];

let successCount = 0;
let totalScripts = scripts.length;

scripts.forEach(script => {
  if (runScript(script.name, script.description)) {
    successCount++;
  }
});

// Resumen final
console.log('\n🎯 RESUMEN DE EJECUCIÓN');
console.log('=======================');
console.log(`✅ Scripts ejecutados exitosamente: ${successCount}/${totalScripts}`);

if (successCount === totalScripts) {
  console.log('\n📁 ARCHIVOS GENERADOS:');
  console.log('======================');
  
  // Listar archivos generados
  outputDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      if (files.length > 0) {
        console.log(`\n📂 ${dir}:`);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          const size = (stats.size / 1024).toFixed(1);
          console.log(`   📄 ${file} (${size} KB)`);
        });
      }
    }
  });
  
  console.log('\n🎉 ¡Informes seleccionados han sido generados exitosamente!');
  console.log('📊 Los resultados están organizados en la carpeta "outputs"');
  console.log('\n📝 Nota: Los informes markdown ya existen en outputs/reports/');
} else {
  console.log('\n⚠️ Algunos scripts fallaron. Revisa los errores arriba.');
  process.exit(1);
} 