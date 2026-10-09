const DB='issd-studio-projects';
function connect() {
  return new Promise((resolve,reject)=> {
    if(!globalThis.indexedDB) return reject(new Error('IndexedDB no está disponible. Exporta el proyecto para conservar los cambios.'));
    const request=indexedDB.open(DB,1);
    request.onupgradeneeded=()=>request.result.createObjectStore('projects');
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
    request.onblocked=()=>reject(new Error('Cierra otras pestañas del editor para habilitar el guardado.'));
  });
}
export async function storeProject(record) {
  const db=await connect();
  try {await new Promise((resolve,reject)=> {
    const tx=db.transaction('projects','readwrite');tx.objectStore('projects').put(record,record.hash);
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Guardado cancelado.'));
  });} finally {db.close();}
}
export async function loadProject(hash) {
  const db=await connect();
  try {return await new Promise((resolve,reject)=> {
    const tx=db.transaction('projects','readonly'),req=tx.objectStore('projects').get(hash);
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });} finally {db.close();}
}
