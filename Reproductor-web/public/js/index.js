//variables globales
var currentSort = "title";
var sortOrder = "asc";
var shuffled = false;
var repeat = false;
var audioDuration = 0;

window.addEventListener("click", (e) => {
	if (e.target === document.getElementById("modalListaCanciones")) {
		document.getElementById("modalListaCanciones").style.display = "none";
	}
	if (e.target === document.getElementById("createPlaylistModal")) {
		document.getElementById("createPlaylistModal").style.display = "none";
	}
	if (e.target === document.getElementById("deletePlaylistModal")) {
		document.getElementById("deletePlaylistModal").style.display = "none";
	}
	if (e.target === document.getElementById("addToPlaylistModal")) {
		document.getElementById("addToPlaylistModal").style.display = "none";
	}
});

document.getElementById("createPlaylistButton").addEventListener("click", function (e) {
	createPlaylist();
});

document.getElementById("deletePlaylistBtn").addEventListener("click", function (e) {
	document.getElementById("deletePlaylistModal").style.display = "none";
	eliminarPlaylist(selectedEditPlaylist);
});

document.getElementById("cancelDeletePlaylistBtn").addEventListener("click", function (e) {
	document.getElementById("deletePlaylistModal").style.display = "none";
});

document.getElementById("editarBtn").addEventListener("click", function (e) {
	document.getElementById("modalListaCanciones").style.display = "none";
	enviarAEditar(selectedSong);
});

document.getElementById("addToPlaylistBtn").addEventListener("click", function (e) {
	document.getElementById("modalListaCanciones").style.display = "none";
	showPlaylistModal();
});

document.getElementById("addToPlaylistBtn2").addEventListener("click", function (e) {
	document.getElementById("modalListaCanciones").style.display = "none";
	let addtoplaylist = document.getElementById("playlistSelector").value;
	if (addtoplaylist === "") {
		alert("Por favor, seleccione una playlist");
		return;
	}
	document.getElementById("addToPlaylistModal").style.display = "none";
	selectedPlaylist = addtoplaylist;
	añadirCancionAPlaylist();
});

document.getElementById("cancelAddToPlaylistBtn").addEventListener("click", function (e) {
	document.getElementById("addToPlaylistModal").style.display = "none";
});

document.getElementById("eliminarBtn").addEventListener("click", function (e) {
	document.getElementById("modalListaCanciones").style.display = "none";
	eliminarCancion(selectedSong);
});

document.getElementById("uploadButton").addEventListener("click", function (e) {
	document.getElementById("inputFile").click();
});

document.getElementById("inputFile").addEventListener("change", async function (e) {
	const file = e.target.files[0];
	if (!file) return;

	let cancion = {};

	await getDuration(file)
		.then((duration) => {
			cancion.duration = duration;
		})
		.catch((error) => {
			console.log(error);
			return;
		});

	await convertAudio(file)
		.then((byteArray) => {
			cancion.cancion = byteArray;
		})
		.catch((error) => {
			console.log(error);
			return;
		});

	leerMediaTags(file, cancion);
});

document.getElementById("play-pause").addEventListener("click", function (e) {
	if (reproduciendo) pausarCancion();
	else {
		resumirCancion();
		reproduciendo = true;
	}
});

document.getElementById("previous").addEventListener("click", function (e) {
	if (indiceCancionActual > 0 && !shuffled) {
		indiceCancionActual--;
		const siguienteCancionId = cancionPlaylist[indiceCancionActual];
		obtenerCancionPorId(siguienteCancionId).then((cancion) => {
			reproducirCancion(cancion);
		});
	} else if (repeat && !shuffled) {
		indiceCancionActual = cancionPlaylist.length - 1;
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
		reproduciendo = true;
	}
});

document.getElementById("stop").addEventListener("click", function (e) {
	cambiarTiempo(0);
	pausarCancion();
});

document.getElementById("next").addEventListener("click", function (e) {
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
		indiceCancionActual--;
		audio.currentTime = 0;
		reproduciendo = true;
	}
});

document.getElementById("volumelow").addEventListener("click", function (e) {
	if (audio.volume > 0.05) audio.volume -= 0.05;
	else audio.volume = 0;
});

document.getElementById("volumehigh").addEventListener("click", function (e) {
	if (audio.volume < 0.95) audio.volume += 0.05;
	else audio.volume = 1;
});

document.getElementById("shuffle").addEventListener("click", function (e) {
	if (shuffled) {
		shuffled = false;
	} else {
		shuffled = true;
		shuffledPlaylist;
	}
	this.classList.toggle("pressed");
});

document.getElementById("repeat").addEventListener("click", function (e) {
	if (repeat) {
		repeat = false;
	} else {
		repeat = true;
	}
	this.classList.toggle("pressed");
});

document.getElementById("progressContainer").addEventListener("click", function (e) {
	var x = e.pageX - this.offsetLeft, // Posición del clic en el elemento
		clickedValue = (x - this.offsetWidth * 0.2) / (this.offsetWidth * 0.6);
	if (clickedValue > -0.01 && clickedValue < 0) clickedValue = 0;
	if (clickedValue < 1.01 && clickedValue > 1) clickedValue = 1;

	if (!isNaN(clickedValue) && isFinite(clickedValue) && clickedValue >= 0 && clickedValue <= 1) {
		if (clickedValue < 0.2 && clickedValue > 0.8) return;
		cambiarTiempo(clickedValue * audioDuration);
	}
});

document.getElementById("form").addEventListener("submit", function (e) {
	e.preventDefault();
	let id = document.getElementById("submit-id").value;
	let title = document.getElementById("submit-title").value;
	let artist = document.getElementById("submit-artist").value;
	let album = document.getElementById("submit-album").value;
	let genre = document.getElementById("submit-genre").value;
	let year = document.getElementById("submit-year").value;

	if (id === "") id = undefined;
	else id = Number(id);
	if (title === "") title = undefined;
	if (artist === "") artist = undefined;
	if (album === "") album = undefined;
	if (genre === "") genre = undefined;
	if (year === "") year = undefined;

	let cancion = {
		title: title,
		artist: artist,
		album: album,
		genre: genre,
		year: year,
	};

	if (id) {
		editarCancion(id, cancion);
	} else {
		alert("Por favor, introduzca el id de la cancion a modificar");
	}
});

document.getElementById("plalistForm").addEventListener("submit", function (e) {
	let nombre = document.getElementById("playlistName").value;
	if (nombre === "") return;
	crearPlaylist(nombre);
});

const tabs = document.querySelectorAll(".tab");
const tabContent = document.querySelectorAll(".tabContent");

function changeTab(tabId) {
	tabs.forEach((tab) => tab.classList.remove("active"));
	tabContent.forEach((tab) => tab.classList.remove("active"));

	const selectedTab = document.getElementById(tabId);
	const selectedTabContent = document.getElementById(tabId + "Tab");

	selectedTab.classList.add("active");
	selectedTabContent.classList.add("active");
}

changeTab("listaCanciones");

tabs.forEach((tab) => {
	tab.addEventListener("click", () => {
		const tabId = tab.id;
		changeTab(tabId);
	});
});

document.querySelectorAll(".elemento").forEach((element) => {
	element.addEventListener("click", () => {
		if (currentSort === element.id) {
			sortOrder = sortOrder === "asc" ? "desc" : "asc";
		} else {
			sortOrder = "asc";
		}
		currentSort = element.id;
		console.log(currentSort)
		verCanciones(currentSort, sortOrder);
	});
});

verCanciones(currentSort, sortOrder);

showPlaylists();
