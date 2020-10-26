window.onload = main;

function main() {
  var id = document.querySelector("html").id;
  switch (id) {
    case 'home':
      imageRotator();
      break;
    case 'album-photos':
      enlargePhotoOnClick();
      break;
  }
}

function imageRotator() {
  var curr = 0;
  var imgArr = document.querySelectorAll("#content img");
  if (imgArr[0].className === 'no-js') {
    var imgInfo =  [{
      src: "/imgs/SeaBase2018.jpg",
      alt: "alt 1"
    }, {
      src: "/imgs/SeaBase2018_2.jpg",
      alt: "alt 2"
    }];

    var content = document.getElementById("content");
    document.getElementsByClassName("no-js")[0].remove();

    var img = document.createElement("img");
    img.classList.add("home-img");
    imgInfo.forEach((element) => {
      imgArr.push(img.cloneNode());
      imgArr[imgArr.length - 1].src = element.src;
      imgArr[imgArr.length - 1].alt = element.alt;
      content.insertBefore(imgArr[imgArr.length - 1], content.children[0]);
    });
  } else {
    imgArr.forEach((item, i) => {
      item.src += "=w" + window.innerWidth;
    });
  }
  setInterval(nextImage, 12500);

  function nextImage(element) {
    imgArr[curr].style.opacity = 0;
    curr = (curr === imgArr.length - 1) ? 0 : curr + 1;
    imgArr[curr].style.opacity = 1;
  }
}

function enlargePhotoOnClick() {
  var imgArr = document.querySelectorAll("#content section figure");
  var overlay = document.querySelector("#content figure.overlay");
  imgArr.forEach((figure, i) => {
    figure.children[0].src += "=w" + window.innerWidth;
    figure.addEventListener('click', (event) => {
      overlay.ariaHidden = "false";
      overlay.children[0].src = figure.children[0].src;
      overlay.children[0].style.width = "auto";
      overlay.children[1].innerHTML = figure.children[1].innerHTML;
      overlay.style.visibility = 'visible';
    });
  });
  overlay.addEventListener('click', (event) => {
    overlay.ariaHidden = "true";
    overlay.style.visibility = '';
  });
}
