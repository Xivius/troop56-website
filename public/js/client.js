window.onload = main;

function main() {
  var id = document.querySelector("html").id;
  switch (id) {
    case 'home':
      imageRotator();
      break;
    case 'photos':
      imageCarousel();
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

function imageCarousel() {
  var imgArr = document.querySelectorAll(".album figure");
  var overlay = document.querySelector(".overlay");
  var close = document.querySelector(".close");
  var leftArrow = document.querySelector(".left");
  var rightArrow = document.querySelector(".right");
  var overlayFigure = document.querySelector(".overlay figure");
  var currentImg = null;

  // Handler Functions
  function clickHandler(e) {
    overlayFigure.children[0].src = e.target.parentNode.children[0].src;
    overlayFigure.children[1].innerHTML = e.target.parentNode.children[1].innerHTML;
    overlay.ariaHidden = "false";
    overlay.style.visibility = 'visible';
    overlay.style.opacity = '1';
    document.body.classList = "noscroll";
    currentImg = e.target.parentNode.parentNode;
    if (!currentImg.previousElementSibling) {
      leftArrow.style.visibility = 'hidden';
    } else if (!currentImg.nextElementSibling) {
      rightArrow.style.visibility = 'hidden';
    }
  }

  function closeHandler(e) {
    overlay.ariaHidden = "true";
    overlay.style.opacity = '0';
    overlay.style.visibility = '';
    document.body.classList = "";
    leftArrow.style.visibility = '';
    rightArrow.style.visibility = '';
  }

  function leftArrowHandler(e) {
    if (currentImg.previousElementSibling) {
      rightArrow.style.visibility = '';
      currentImg = currentImg.previousElementSibling;
      overlayFigure.children[0].src = currentImg.children[0].children[0].src;
      overlayFigure.children[1].innerHTML = currentImg.children[0].children[1].innerHTML;
      if (!currentImg.previousElementSibling) {
        leftArrow.style.visibility = 'hidden';
      }
    }
  }

  function rightArrowHandler(e) {
    if (currentImg.nextElementSibling) {
      leftArrow.style.visibility = '';
      currentImg = currentImg.nextElementSibling;
      overlayFigure.children[0].src = currentImg.children[0].children[0].src;
      overlayFigure.children[1].innerHTML = currentImg.children[0].children[1].innerHTML;
      if (!currentImg.nextElementSibling) {
        rightArrow.style.visibility = 'hidden';
      }
    }
  }

  // Handle Image Enlargement
  imgArr.forEach((figure, i) => {
    figure.children[0].src += "=w" + window.innerWidth;
    figure.children[0].addEventListener('click', clickHandler);
    figure.children[1].addEventListener('click', clickHandler);
  });
  // Handle Overlay Closing
  close.addEventListener('click', closeHandler);
  // Handle Arrow Picture Rotation
  leftArrow.addEventListener('click', leftArrowHandler);
  rightArrow.addEventListener('click', rightArrowHandler);

  // Handle Key Presses
  window.addEventListener('keydown', function (e) {
    console.log(e.keyCode);
    if (e.keyCode === 27) { // esc
      closeHandler(e);
    } else if (e.keyCode === 37) {  // ←
      leftArrowHandler(e);
    } else if (e.keyCode === 39) { // →
      rightArrowHandler(e);
    }
  });
}
