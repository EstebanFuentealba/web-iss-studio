export default class Storage {
  constructor() {
    this.indexedDB =
      window.indexedDB ||
      window.mozIndexedDB ||
      window.webkitIndexedDB ||
      window.msIndexedDB;

    if (this.indexedDB === undefined) {
      console.warn("Storage: IndexedDB not available.");
      return { init: () => {}, get: () => {}, set: () => {}, clear: () => {} };
    }

    this.name = "web-iss-studio";
    this.version = 1;
    this.database = undefined;
  }
  init(callback) {
    var request = this.indexedDB.open(this.name, this.version);
    request.onupgradeneeded = (event) => {
      var db = event.target.result;
      if (db.objectStoreNames.contains("states") === false) {
        db.createObjectStore("states");
      }
    };

    request.onsuccess = (event) => {
      this.database = event.target.result;

      callback();
    };

    request.onerror = (event) => {
      console.error("IndexedDB", event);
    };
  }

  get(callback) {
    var transaction = this.database.transaction(["states"], "readwrite");
    var objectStore = transaction.objectStore("states");
    var request = objectStore.get(0);
    request.onsuccess = (event) => {
      callback(event.target.result);
    };
  }

  set(data) {
    var start = performance.now();

    var transaction = this.database.transaction(["states"], "readwrite");
    var objectStore = transaction.objectStore("states");
    var request = objectStore.put(data, 0);
    request.onsuccess = () => {
      console.log(
        "[" + /\d\d\:\d\d\:\d\d/.exec(new Date())[0] + "]",
        "Saved state to IndexedDB. " +
          (performance.now() - start).toFixed(2) +
          "ms"
      );
    };
  }

  clear() {
    if (this.database === undefined) return;

    var transaction = this.database.transaction(["states"], "readwrite");
    var objectStore = transaction.objectStore("states");
    var request = objectStore.clear();
    request.onsuccess = () => {
      console.log(
        "[" + /\d\d\:\d\d\:\d\d/.exec(new Date())[0] + "]",
        "Cleared IndexedDB."
      );
    };
  }
}
