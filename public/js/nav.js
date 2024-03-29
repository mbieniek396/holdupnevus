 /////////////////////////////////////////////////////////
/////////// Add bg to nav after scrolling out of main///
//////////////////////////////////////////////////////////
let navBG = false;
let menuIsOpen = false;
let nav = document.querySelector('nav');
let openMenu = document.querySelector(".menuIcon");
let linksMenu = document.querySelector(".links");

const showScroll = function(){
    let size = window.innerHeight * 0.85

    if (!navBG && window.scrollY >= size){
        nav.classList.add('navBG');
        navBG=true;
    }
    if (window.scrollY < size){
        if (window.innerWidth > 850){
            nav.classList.remove('navBG');
        }else if (menuIsOpen){
            nav.classList.add('navBG');
        }
    }

    if (navBG && window.scrollY < size){
        navBG = false;
        if (!menuIsOpen){
            nav.classList.remove('navBG');
        }
    }
}
showScroll()

const fixLinks = function(){
    if (!menuIsOpen){
        if (window.innerWidth <= 850){
            linksMenu.classList.add('hide');
        }else{
            linksMenu.classList.remove('hide');
        }
    }
}
fixLinks();

window.addEventListener('scroll', showScroll)
window.addEventListener('resize', showScroll)
window.addEventListener('resize', fixLinks);

openMenu.addEventListener('click', () => {
    linksMenu.classList.toggle('hide');
    openMenu.classList.toggle('openedMenuIcon')
    menuIsOpen = menuIsOpen ? false : true;
    if (!navBG){
        nav.classList.toggle('navBG');
    }
});


setTimeout(() => {linksMenu.classList.remove('fadeLinks')}, 1500);