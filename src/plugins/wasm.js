/**
 *
 * @author Esteban Fuentealba
 */
function createWASMCore() {
  return new Promise((resolve, reject) => {
    let script = document.createElement("script");
    script.async = true;
    script.src = "/wasm/iss-studio-core.js";
    script.type = "text/javascript";
    script.addEventListener("load", (data) => {
      console.log("iss-studio-core.js script loaded");
      resolve(createISSStudioCore);
    });
    script.addEventListener("error", (error) => {
      reject(error);
    });
    document.getElementsByTagName("head")[0].appendChild(script);
  });
}
function readFromBlobOrFile(blob) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      resolve(fileReader.result);
    };
    fileReader.onerror = ({
      target: {
        error: { code },
      },
    }) => {
      reject(Error(`File could not be read! Code=${code}`));
    };
    fileReader.readAsArrayBuffer(blob);
  });
}

async function fetchFile(_data) {
  let data = _data;
  if (typeof _data === "undefined") {
    return new Uint8Array();
  }
  data = await readFromBlobOrFile(_data);
  return new Uint8Array(data);
}

export default {
  install: (app, options) => {
    createWASMCore()
      .then(async (createISSStudioCore) => {
        const Core = await createISSStudioCore();
        const FS = Core.FS;

        async function setFile(blob) {
          let data = await fetchFile(blob);
          let stream = FS.open("iss.sfc", "w+");
          FS.write(stream, data, 0, data.length, 0);
          FS.close(stream);
          return data;
        }

        const decompress = (offset) => {
          return new Promise((resolve, reject) => {
            let code = Core.cwrap("decompress", "number", [
              "string",
              "string",
              "string",
            ])("iss.sfc", offset, "1");
            if (code == 0) {
              resolve(FS.readFile("decomp.bin"));
            } else {
              reject(code);
            }
          });
        };

        const compress = () =>
          Core.cwrap("compress", "number", ["string", "string"])(
            "decomp.bin",
            "1"
          );

        app.config.globalProperties.$core = {
          d: decompress,
          c: compress,
          f: setFile,
        };
      })
      .catch(() => {
        console.log(Error("Not supported"));
      });
  },
};
