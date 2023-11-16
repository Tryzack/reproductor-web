const DB_NAME = "reproductor";
const DB_VERSION = 8;

let request = indexedDB.open(DB_NAME, DB_VERSION);

request.onerror = (e) => {
	console.log("Error al abrir/crear la base de datos" + e.target.errorCode);
};

request.onsuccess = (e) => {
	console.log("Base de datos abierta/creada correctamente");
};

request.onupgradeneeded = (e) => {
	let db = e.target.result;

	if (db.objectStoreNames.contains("canciones")) {
		db.deleteObjectStore("canciones");
	}

	let objectStore = db.createObjectStore("canciones", { keyPath: "id", autoIncrement: true });

	objectStore.createIndex("id", "id", { unique: true });
	objectStore.createIndex("title", "title", { unique: false });
	objectStore.createIndex("artist", "artist", { unique: false });
	objectStore.createIndex("genre", "genre", { unique: false });
	objectStore.createIndex("album", "album", { unique: false });
	objectStore.createIndex("year", "album", { unique: false });
	objectStore.createIndex("duration", "duration", { unique: false });

	if(db.objectStoreNames.contains("playlist")) {
		db.deleteObjectStore("playlist");
	}

	let objectStore2 = db.createObjectStore("playlist", { keyPath: "nombre" });

	objectStore2.createIndex("nombre", "nombre", { unique: true });

	console.log("Base de datos actualizada");
};

function agregarFilas(cancion) {
	let nuevaFila = {
		cancion: cancion.cancion,
		title: cancion.title || "",
		artist: cancion.artist || "",
		genre: cancion.genre || "",
		album: cancion.album || "",
		year: cancion.year || "",
		picture: cancion.picture || "",
		lyrics: cancion.lyrics || "",
		duration: cancion.duration || "",
	};

	let request = indexedDB.open(DB_NAME, DB_VERSION);
	request.onerror = (e) => {
		console.log("Error al abrir la base de datos " + e.target.errorCode);
	};
	request.onsuccess = (e) => {
		let db = e.target.result;
		let transaction = db.transaction(["canciones"], "readwrite");
		let objectStore = transaction.objectStore("canciones");

		let requestGet = objectStore.index("title").get(nuevaFila.title);

		requestGet.onsuccess = (e) => {
			let cancion = e.target.result;
			if (cancion) {
				alert("La canción ya existe en la base de datos");
				return;
			}
			let requestAdd = objectStore.add(nuevaFila);
			requestAdd.onsuccess = (e) => {
				alert("Canción agregada correctamente");
				verCanciones(currentSort, sortOrder);
			};
			requestAdd.onerror = (e) => {
				alert("Error al agregar la canción");
			};
		};

		requestGet.onerror = (e) => {
			alert("Error al buscar la canción");
		};
	};
}

function getAllCanciones(sort, order) {
	return new Promise((resolve, reject) => {
		let request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onerror = (e) => {
			console.log("Error al abrir la base de datos " + e.target.errorCode);
		};
		request.onsuccess = (e) => {
			let db = e.target.result;
			let transaction = db.transaction(["canciones"], "readonly");
			let objectStore = transaction.objectStore("canciones");

			let canciones = [];
			let requestCursor;
			let index;
			if (
				sort === "id" ||
				sort === "title" ||
				sort === "artist" ||
				sort === "genre" ||
				sort === "year" ||
				sort === "album" ||
				sort === "duration"
			) {
				index = objectStore.index(sort);
			} else {
				index = objectStore.index("title");
			}
			if (order === "asc") requestCursor = index.openCursor();
			else requestCursor = index.openCursor(null, "prev");

			requestCursor.onsuccess = (e) => {
				let cursor = e.target.result;
				if (cursor) {
					canciones.push({
						id: cursor.value.id,
						cancion: cursor.value.cancion,
						title: cursor.value.title || "",
						artist: cursor.value.artist || "",
						genre: cursor.value.genre || "",
						album: cursor.value.album || "",
						year: cursor.value.year || "",
						picture: cursor.value.picture || "",
						lyrics: cursor.value.lyrics || "",
						duration: cursor.value.duration || "",
					});
					cursor.continue();
				} else {
					let oldElements = document.getElementById("lista").querySelectorAll(".elemento2");
					oldElements.forEach((element) => {
						element.parentNode.removeChild(element);
					});
					cancionPlaylist = [];
					canciones.forEach((cancion) => {
						cancionPlaylist.push(cancion.id);
						addRow(cancion);
					});
					resolve(canciones);
				}
			};

			requestCursor.onerror = (e) => {
				alert("Error al obtener las canciones");
				reject(e.target.errorCode);
			};
		};
	});
}

function getPlaylistCanciones(cancionPlaylist, sort, order) {
	return new Promise((resolve, reject) => {
		let request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onerror = (e) => {
			console.log("Error al abrir la base de datos " + e.target.errorCode);
		};
		request.onsuccess = (e) => {
			let db = e.target.result;
			let transaction = db.transaction(["canciones"], "readonly");
			let objectStore = transaction.objectStore("canciones");

			let canciones = [];
			let requestCursor;
			let index;
			if (
				sort === "id" ||
				sort === "title" ||
				sort === "artist" ||
				sort === "genre" ||
				sort === "year" ||
				sort === "album" ||
				sort === "duration"
			) {
				index = objectStore.index(sort);
			} else {
				index = objectStore.index("title");
			}
			if (order === "asc") requestCursor = index.openCursor();
			else requestCursor = index.openCursor(null, "prev");

			requestCursor.onsuccess = (e) => {
				let cursor = e.target.result;
				if (cursor) {
					if (cancionPlaylist.includes(cursor.value.id)) {
						canciones.push({
							id: cursor.value.id,
							cancion: cursor.value.cancion,
							title: cursor.value.title || "",
							artist: cursor.value.artist || "",
							genre: cursor.value.genre || "",
							album: cursor.value.album || "",
							year: cursor.value.year || "",
							picture: cursor.value.picture || "",
							lyrics: cursor.value.lyrics || "",
							duration: cursor.value.duration || "",
						});
					}
					cursor.continue();
				} else {
					let oldElements = document.getElementById("lista").querySelectorAll(".elemento2");
					oldElements.forEach((element) => {
						element.parentNode.removeChild(element);
					});
					cancionPlaylist = [];
					canciones.forEach((cancion) => {
						cancionPlaylist.push(cancion.id);
						addRow(cancion);
					});
					resolve(canciones);
				}
			};

			requestCursor.onerror = (e) => {
				alert("Error al obtener las canciones");
				reject(e.target.errorCode);
			};
		};
	});
}

function obtenerCancionPorId(id) {
	return new Promise((resolve, reject) => {
		let request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onerror = (e) => {
			console.log("Error al abrir la base de datos " + e.target.errorCode);
		};
		request.onsuccess = (e) => {
			let db = e.target.result;
			let transaction = db.transaction(["canciones"], "readonly");
			let objectStore = transaction.objectStore("canciones");

			let requestGet = objectStore.get(id);

			requestGet.onsuccess = (e) => {
				let cancion = e.target.result;
				if (cancion) {
					resolve(cancion);
				} else {
					alert("La canción no existe");
					reject();
				}
			};

			requestGet.onerror = (e) => {
				alert("Error al buscar la canción");
				reject();
			};
		};
	});
}

function eliminarCancion(cancionId) {
	let request = indexedDB.open(DB_NAME, DB_VERSION);
	request.onerror = (e) => {
		console.log("Error al abrir la base de datos " + e.target.errorCode);
	};
	request.onsuccess = (e) => {
		let db = e.target.result;
		let transaction = db.transaction(["canciones"], "readwrite");
		let objectStore = transaction.objectStore("canciones");

		let requestDelete = objectStore.delete(cancionId);

		requestDelete.onsuccess = (e) => {
			console.log("Canción eliminada correctamente");
			verCanciones(currentSort, sortOrder);
		};

		requestDelete.onerror = (e) => {
			alert("Error al eliminar la canción");
		};
	};
}

function editarCancion(cancionId, nuevosDatos) {
	let request = indexedDB.open(DB_NAME, DB_VERSION);
	request.onerror = (e) => {
		console.log("Error al abrir la base de datos " + e.target.errorCode);
	};
	request.onsuccess = (e) => {
		let db = e.target.result;
		let transaction = db.transaction(["canciones"], "readwrite");
		let objectStore = transaction.objectStore("canciones");

		let requestGet = objectStore.get(cancionId);

		requestGet.onsuccess = (e) => {
			let cancion = e.target.result;
			if (cancion) {
				for (let key in nuevosDatos) {
					if (nuevosDatos[key] !== undefined) cancion[key] = nuevosDatos[key];
				}

				let requestUpdate = objectStore.put(cancion);

				requestUpdate.onsuccess = (e) => {
					alert("Canción actualizada correctamente");
					verCanciones(currentSort, sortOrder);
					document.getElementById("form").reset();
				};

				requestUpdate.onerror = (e) => {
					alert("Error al actualizar la canción");
				};
			} else {
				console.log("La canción no existe");
			}
		};

		requestGet.onerror = (e) => {
			alert("Error al obtener la canción");
		};
	};
}

function crearPlaylist(nombre) {
	let request = indexedDB.open(DB_NAME, DB_VERSION);

	request.onerror = (e) => {
		console.log("Error al abrir la base de datos " + e.target.errorCode);
	};

	request.onsuccess = (e) => {
		let db = e.target.result;
		transaction = db.transaction("playlist", "readwrite");
		let objectStore = transaction.objectStore("playlist");

		let requestGet = objectStore.get(nombre);
		requestGet.onsuccess = (e) => {
			let playlist = e.target.result;
			if (playlist) {
				alert("La playlist ya existe");
				return;
			}

			let requestAdd = objectStore.add({ nombre: nombre, songs: [] });

			requestAdd.onsuccess = (e) => {
				showPlaylists();
			};

			requestAdd.onerror = (e) => {
				alert("Error al crear la playlist");
			};
		};
	};
}

function editPlaylist(nombre, canciones) {
	let request = indexedDB.open(DB_NAME, DB_VERSION);

	request.onerror = (e) => {
		console.log("Error al abrir la base de datos " + e.target.errorCode);
	};

	request.onsuccess = (e) => {
		let db = e.target.result;
		transaction = db.transaction("playlist", "readwrite");
		let objectStore = transaction.objectStore("playlist");

		let requestGet = objectStore.get(nombre);
		requestGet.onsuccess = (e) => {
			let playlist = e.target.result;
			if (!playlist) {
				alert("La playlist no existe");
				return;
			}

			playlist.songs = canciones;

			let requestUpdate = objectStore.put(playlist);

			requestUpdate.onsuccess = (e) => {
				showPlaylists();
			};

			requestUpdate.onerror = (e) => {
				alert("Error al editar la playlist");
			};
		};
	};
}

function eliminarPlaylist(nombre) {
	let request = indexedDB.open(DB_NAME, DB_VERSION);
	request.onerror = (e) => {
		console.log("Error al abrir la base de datos " + e.target.errorCode);
	};
	request.onsuccess = (e) => {
		let db = e.target.result;
		let transaction = db.transaction("playlist", "readwrite");
		let objectStore = transaction.objectStore("playlist");

		let requestGet = objectStore.get(nombre);
		requestGet.onsuccess = (e) => {
			if (!e.target.result) {
				alert("La playlist no existe");
				return;
			}

			let requestDelete = objectStore.delete(nombre);

			requestDelete.onsuccess = () => {
				showPlaylists();
			};

			requestDelete.onerror = () => {
				alert("Error al eliminar la playlist");
			};
		};
	};
}

function getAllPlaylists() {
	return new Promise((resolve, reject) => {
		let request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onerror = (e) => {
			console.log("Error al abrir la base de datos " + e.target.errorCode);
		};
		request.onsuccess = (e) => {
			let db = e.target.result;
			let transaction = db.transaction("playlist", "readonly");
			let objectStore = transaction.objectStore("playlist");

			let requestCursor = objectStore.openCursor();

			let playlists = [];

			requestCursor.onsuccess = (e) => {
				let cursor = e.target.result;
				if (cursor) {
					playlists.push({
						nombre: cursor.value.nombre,
						songs: cursor.value.songs,
					});
					cursor.continue();
				} else {
					resolve(playlists);
				}
			};

			requestCursor.onerror = (e) => {
				alert("Error al obtener las playlists");
				reject(e.target.errorCode);
			};
		};
	});
}
