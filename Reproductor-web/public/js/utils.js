var audio;
var reproduciendo = false;
var cancionPlaylist = [];
var shuffledPlaylist = [];
var indiceCancionActual = 0;
var currentPlaylist = "default";
let intervalo;
var selectedSong = undefined;
var selectedPlaylist = undefined;
var selectedEditPlaylist = undefined;

function convertAudio(file) {
	return new Promise((resolve, reject) => {
		let reader = new FileReader();
		reader.onload = function (e) {
			let byteArray = new Uint8Array(e.target.result);
			resolve(byteArray);
		};
		reader.onerror = reject;
		reader.readAsArrayBuffer(file);
	});
}

function reproducirCancion(cancion) {
	let blob = new Blob([cancion.cancion], { type: "audio/mp3" });
	let audioURL = URL.createObjectURL(blob);
	if (audio) {
		audio.pause();
		audio = null;
	}
	audio = new Audio(audioURL);
	audio.volume = 0.1;
	audio.play();
	addToPlaying(cancion);
	setProgressBar(cancion.duration);
	audioDuration = cancion.duration;
	reproduciendo = true;
}

function cambiarTiempo(tiempo) {
	if (audio) audio.currentTime = tiempo;
}

function pausarCancion() {
	if (audio) audio.pause();
	reproduciendo = false;
}

function resumirCancion() {
	if (audio) {
		if (audio.currentTime === 0) {
			audio.play();
			reproduciendo = true;
			setProgressBar(audio.duration);
			return;
		} else {
			audio.play();
			reproduciendo = true;
		}
	} else console.log("ERROR: No hay canción para reproducir");
}

function setProgressBar(duracionTotal) {
	if (intervalo) {
		clearInterval(intervalo);
	}

	duracionTotal *= 1000;
	const intervaloTiempo = 100;

	function actualizar() {
		const tiempoActual = audio.currentTime * 1000;
		const porcentajeProgreso = (tiempoActual / duracionTotal) * 60;
		document.getElementById("progressBar").style.width = porcentajeProgreso + "%";

		if (tiempoActual >= duracionTotal || porcentajeProgreso >= 60) {
			onCancionEnd();
		} else {
			intervalo = setTimeout(actualizar, intervaloTiempo);
		}
	}

	intervalo = setTimeout(actualizar, intervaloTiempo);
}

function actualizarBarraProgreso(tiempoActual, duracionTotal) {
	const porcentajeProgeso = (tiempoActual / duracionTotal) * 60;
	document.getElementById("progressBar").style.width = porcentajeProgeso + "%";
}

function onCancionEnd() {
	indiceCancionActual++;
	if (indiceCancionActual < cancionPlaylist.length && !shuffled) {
		const siguienteCancionId = cancionPlaylist[indiceCancionActual];
		obtenerCancionPorId(siguienteCancionId).then((cancion) => {
			reproducirCancion(cancion);
		});
	} else if (repeat && !shuffled) {
		indiceCancionActual = 0;
		const siguienteCancionId = cancionPlaylist[indiceCancionActual];
		obtenerCancionPorId(siguienteCancionId).then((cancion) => {
			reproducirCancion(cancion);
		});
	} else if (shuffled) {
		indiceCancionActual = Math.floor(Math.random() * cancionPlaylist.length);
		const siguienteCancionId = cancionPlaylist[indiceCancionActual];
		obtenerCancionPorId(siguienteCancionId).then((cancion) => {
			reproducirCancion(cancion);
		});
	} else {
		audio.currentTime = 0;
		audio.pause();
		clearInterval(intervalo);
	}
}

function addRow(cancion) {
	const row = [cancion.id, cancion.title, cancion.artist, cancion.album, cancion.genre, cancion.year, cancion.duration];

	row.forEach((element) => {
		if (element == cancion.duration) {
			let minutes = Math.floor(element / 60);
			let seconds = Math.floor(element % 60);
			minutes = minutes < 10 ? "0" + minutes : minutes;
			seconds = seconds < 10 ? "0" + seconds : seconds;
			element = minutes + ":" + seconds;
		}
		const div = document.createElement("div");
		div.innerHTML = element;
		div.className = "elemento2";

		div.addEventListener("dblclick", () => {
			reproducirCancion(cancion);
			indiceCancionActual = cancionPlaylist.indexOf(cancion.id);
			changeTab("playing");
		});
		div.addEventListener("mouseover", () => {
			div.classList.add("elemento2-hover");
		});

		div.addEventListener("mouseout", () => {
			div.classList.remove("elemento2-hover");
		});

		div.addEventListener("contextmenu", (e) => {
			e.preventDefault();
			const x = e.clientX;
			const y = e.clientY;

			document.getElementById("modalListaCanciones").style.display = "block";
			document.getElementById("modalListaCancionesContent").style.top = y + "px";
			document.getElementById("modalListaCancionesContent").style.left = x + "px";

			selectedSong = cancion.id;
		});

		document.getElementById("lista").appendChild(div);
	});
}

function addImage(imageArray) {
	let imagenContainer = document.getElementById("imagenContainer");
	imagenContainer.innerHTML = "";
	let img = new Image();
	img.onload = () => {
		let canvas = document.createElement("canvas");
		let ctx = canvas.getContext("2d");

		canvas.width = 450;
		canvas.height = 450;
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
		let resizedImageURL = canvas.toDataURL("image/jpeg");

		let resizedImg = document.createElement("img");
		resizedImg.src = resizedImageURL;

		imagenContainer.appendChild(resizedImg);
	};
	img.src = URL.createObjectURL(new Blob([imageArray], { type: "image/jpeg" }));
	if (!imageArray) {
		img.src = "./public/assets/music-placeholder.jpg";
	}
}

function addToPlaying(cancion) {
	document.getElementById("titlePlaying").innerHTML = cancion.title;
	document.getElementById("artistPlaying").innerHTML = cancion.artist;
	document.getElementById("lyricContainer").style.display = "block";
	document.getElementById("lyric").innerHTML = cancion.lyrics;
	addImage(cancion.picture);
}

function leerMediaTags(file, cancion) {
	jsmediatags.read(file, {
		onSuccess: function (tag) {
			if (tag.tags.title) {
				cancion.title = tag.tags.title;
			} else {
				cancion.title = "";
			}
			if (tag.tags.artist) {
				cancion.artist = tag.tags.artist;
			} else {
				cancion.artist = "";
			}
			if (tag.tags.genre) {
				cancion.genre = tag.tags.genre;
			} else {
				cancion.genre = "";
			}
			if (tag.tags.album) {
				cancion.album = tag.tags.album;
			} else {
				cancion.album = "";
			}
			if (tag.tags.year) {
				cancion.year = tag.tags.year;
			} else {
				cancion.year = "";
			}
			if (tag.tags.lyrics) {
				let lyrics = tag.tags.lyrics.lyrics;
				lyrics = lyrics.replace(/\r\n/g, "<br>");
				cancion.lyrics = lyrics;
			} else {
				cancion.lyrics = "";
			}
			if (tag.tags.picture) {
				let imageData = tag.tags.picture.data;
				let imageArray = new Uint8Array(imageData);
				cancion.picture = imageArray;
			} else document.getElementById("imagenContainer").innerHTML = "";

			agregarFilas(cancion);
		},
		onError: function (error) {
			console.log("Hubo un error al leer los metadatos:", error);
		},
	});
}

function getDuration(file) {
	return new Promise((resolve, reject) => {
		let reader = new FileReader();
		reader.onload = function (e) {
			let byteArray = new Uint8Array(e.target.result);
			let audio = new Audio(URL.createObjectURL(new Blob([byteArray], { type: "audio/mp3" })));
			audio.onloadedmetadata = function () {
				resolve(audio.duration);
			};
		};
		reader.onerror = reject;
		reader.readAsArrayBuffer(file);
	});
}

function enviarAEditar(id) {
	changeTab("add");
	document.getElementById("submit-id").value = id;
}

function createPlaylist() {
	document.getElementById("createPlaylistModal").style.display = "block";
	showPlaylists();
}

function showPlaylists() {
	let grid = document.getElementById("playlistContainer");
	grid.innerHTML = "";
	let basePlaylist = document.createElement("div");
	basePlaylist.setAttribute("class", "playlist");
	basePlaylist.id = "todasLasCanciones";
	let img = document.createElement("img");
	img.src = "./public/assets/music-placeholder.jpg";
	img.setAttribute("class", "playlistImg");
	let title = document.createElement("div");
	title.innerHTML = "Todas las canciones";
	title.id = "playlistTitle";
	basePlaylist.appendChild(img);
	basePlaylist.appendChild(title);
	grid.appendChild(basePlaylist);
	basePlaylist.addEventListener("dblclick", function (e) {
		selectedPlaylist = undefined;
		verCanciones(currentSort, sortOrder).then(()=>{changeTab("listaCanciones");});
	});

	getAllPlaylists().then((playlists) => {
		playlists.forEach((playlist) => {
			let playlistdiv = document.createElement("div");
			playlistdiv.setAttribute("class", "playlist");
			let img = document.createElement("img");
			img.src = "./public/assets/music-placeholder.jpg";
			img.setAttribute("class", "playlistImg");
			let title = document.createElement("div");
			title.innerHTML = playlist.nombre;
			title.id = "playlistTitle";
			playlistdiv.appendChild(img);
			playlistdiv.appendChild(title);
			playlistdiv.addEventListener("contextmenu", (e) => {
				selectedEditPlaylist = playlist.nombre;
				e.preventDefault();
				const x = e.clientX;
				const y = e.clientY;

				document.getElementById("deletePlaylistModal").style.display = "block";
				document.getElementById("deletePlaylistContent").style.top = y + "px";
				document.getElementById("deletePlaylistContent").style.left = x + "px";

				selectedSong = playlist.id;
			});
			playlistdiv.addEventListener("dblclick", function (e) {
				selectedPlaylist = playlist.nombre;
				cancionPlaylist = playlist.songs;
				verCanciones(currentSort, sortOrder).then(()=>{changeTab("listaCanciones");});
			});
			grid.appendChild(playlistdiv);
		});
	});
}

function verCanciones(sort, order) {
	return new Promise((resolve, reject) => {
		if (selectedPlaylist === undefined) getAllCanciones(sort, order).then((canciones) => {resolve(canciones);});
		else {
			getPlaylistCanciones(cancionPlaylist, sort, order).then((canciones) => {resolve(canciones);});
		}
	});
}


function showPlaylistModal() {
	document.getElementById("addToPlaylistModal").style.display = "block";
	let selector = document.getElementById("playlistSelector");
	selector.innerHTML = "";
	let defaultOption = document.createElement("option");
	defaultOption.value = "";
	defaultOption.innerHTML = "Seleccionar playlist";
	selector.appendChild(defaultOption);

	getAllPlaylists().then((playlists) => {
		playlists.forEach((playlist) => {
			let option = document.createElement("option");
			option.value = playlist.nombre;
			option.innerHTML = playlist.nombre;
			selector.appendChild(option);
		});
	});
}

function añadirCancionAPlaylist() {
	getAllPlaylists().then((playlists) => {
		playlists.forEach((playlist) => {
			if (playlist.nombre === selectedPlaylist && !playlist.songs.includes(selectedSong)) {
				playlist.songs.push(selectedSong);

				editPlaylist(playlist.nombre, playlist.songs);
			}
		});
	});
}
