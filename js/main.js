/*
    - Screen to display item to tap
    - display screen shows one item
    - One in three chance of displaying item
    - Start timer at 1.5s
    - Minimum 750ms -- test this
    - score 1 for not tapping and 2 for tapping correctly

    Screens needed
    - Intro screen
    - Item to find screen
        - Ready...Set...Go
    - Tappable screen
        - difficulty 1 = 5 items
        - 2 = 10
        - 3 = 10
        - 4
 */

var playing = false;
var difficulty = 1; // gets higher as score increases, adds more items to click
var play_state = "";
var second_counter = 0;
var animate_counter = 0;
var animate_interval = 100;
var lastTime;

var smileys = ["\uE814","\uE812","\uE813","\uE815"];
//var safe_colors = ["#FFFFFF", "#FFB6DB", "#B6DBFF", "#FFFF6D;"];
var safe_colors = ["255,255,255", "255,182,219", "182,219,255", "255,255,109"];
var scores = ["\uE800","\uE3CE"];

var score = 0;
var highscore = 0;

var items = ["\uE84E","\uE84F","\uE851","\uE853","\uE855","\uE869","\uE8F6","\uE872","\uE926","\uE87A","\uE87B","\uE87C","\uE87D"
            ,"\uE90D","\uE885","\uE88A","\uE891","\uE894","\uE90F","\uE897","\uE91B","\uE925","\uE91D","\uE91E","\uE8AD"
            ,"\uE8B6","\uE8DC","\uE8DB","\uE8F4","\uE8F9","\uE029","\uE063","\uE0B0","\uE0BE","\uE0DA"
            ,"\uE14E","\uE14F","\uE150","\uE153","\uE195","\uE1AC","\uE226","\uE227"
            ,"\uE6DD","\uE243","\uE25F","\uE24E","\uE2C2","\uE310","\uE312","\uE320","\uE32A","\uE32D"
            ,"\uE332","\uE334","\uE3A1","\uE3A8","\uE3AE","\uE3AF"
            ,"\uE3B0","\uE3B7","\uE3B8","\uE3E3","\uE3E4","\uE3E7","\uE43A","\uE407","\uE416","\uE41C"
            ,"\uE52E","\uE52F","\uE532","\uE530","\uE531","\uE566"
            ,"\uE536","\uE540","\uE541","\uE556","\uE545","\uE546","\uE54D","\uE558","\uE55B","\uE56C"
            ,"\uE565","\uE63D","\uEB3B","\uEB3E","\uEB40","\uEB41"
            ,"\uEB42","\uEB43","\uEB45","\uEB48","\uEB4C","\uE7E9","\uE80B","\uE80E"];

var item_length = items.length;

var tap_item = {};
var match_item = {};
var score_item = {};

var intro;
var canvas;
var context;
var deviceWidth = 360;
var deviceHeight = 360;
var centerX;
var centerY;

window.addEventListener("load", function load(event){

    document.addEventListener('tizenhwkey', function(e) {
        if(e.keyName === "back") {
            try {
                tizen.power.release("SCREEN");
                tizen.application.getCurrentApplication().exit();
            } catch (ignore) {
            }
        }
    });

    if (localStorage.getItem("highscore") === null) {
        // first time playing
        localStorage.setItem("highscore", 0);
    } else {
        highscore = localStorage.getItem("highscore");
    }

    try {
        tizen.systeminfo.getPropertyValue("DISPLAY", function(disp) {
            deviceWidth = disp.resolutionWidth;
            deviceHeight = disp.resolutionHeight;
        });
    } catch (e) {
        console.log("caught tizen error...");
        deviceWidth = 360;
        deviceHeight = 360;
    } finally {
        intro = document.getElementById('intro');
        canvas = document.getElementById('canvas');
        context = canvas.getContext('2d');
        centerX = deviceWidth / 2;
        centerY = deviceHeight / 2;
        showIntro();
    }

},false);

function animate(currTime) {

    var second_triggered = false;
    var animate_triggered = false;

    if (!currTime) {
      currTime = window.performance.now();
    }

    if (!lastTime) {
      lastTime = currTime;
    }

    var diff = currTime - lastTime;
    second_counter += diff;
    lastTime = currTime;

//    console.log("counters", second_counter, animate_counter, currTime, lastTime);
    if (second_counter > 1000) {
      // second counter triggered
      second_triggered = true;
      second_counter = 0;
    }

    animate_counter += diff;
    if (animate_counter > animate_interval) {
      console.log("animation counter triggered...");
      animate_triggered = true;
      animate_counter = 0;
    }

    // now draw
    clearCanvasRegion(0, 0, canvas.width, canvas.height);

    if (play_state != "MATCH") {
        context.textAlign = "left";
        context.fillStyle = "#FFFF00";
        context.font = "18px 'VideoGame'";
        var score_text = "SCORE " + score;
        context.fillText(score_text, deviceWidth / 2 - (score_text.length * 18) / 2, 40);
    }

    switch (play_state) {

        case "TAP":
            getTapItem(animate_triggered);

            if (play_state == "DEAD") {
                playing = false;
            }

            break;

        case "SCORE":
            getScoreItem(animate_triggered);
            break;

        case "MATCH":

            if (animate_triggered == true) {
                match_item.warning_length -= 1;

                if (match_item.warning_length < 0) {
                    match_item.warning_length = match_item.warning_total;
                    match_item.warning_stage++;

                    if (match_item.warning_stage > 2) {
                        getTapItem(false);
                    }
                }
            }

            if (match_item.warning_stage <= 2) {
                drawMatchScreen();
            }
            break;

        case "DEAD":
            drawCurrentTapItem();
            playing = false;
            break;

    }

    if (playing == true) {
        window.requestAnimationFrame(animate);
    }
}

function drawMatchScreen() {

    var out_text;
    var font_size = 13;

    context.textBaseline = "middle";
    context.textAlign = "center";
    context.fillStyle = "#00FF00";
    context.font = font_size + "px 'VideoGame'";

    if (difficulty > 1) {
        out_text = "Only tap this item";
        context.fillText(out_text, deviceWidth / 2, 50);

        out_text = "in the same color.";
        context.fillText(out_text, deviceWidth / 2, 75);

        out_text = "Ignore everything else.";
        context.fillText(out_text, deviceWidth / 2, 100);
    } else {
        out_text = "Only tap this item.";
        context.fillText(out_text, deviceWidth / 2, 60);

        out_text = "Ignore everything else.";
        context.fillText(out_text, deviceWidth / 2, 90);
    }

    context.fillStyle = "rgba(" + match_item.color + ", 1)";
    context.font = "164px 'Material Icons'";
    context.fillText(match_item.item, centerX, 190);

    context.fillStyle = "#00FFFF";
    context.font = "16px 'VideoGame'";

    switch (match_item.warning_stage) {
        case 0:
            out_text = "READY";
            break;

        case 1:
            out_text = "READY...SET";
            break;

        case 2:
            out_text = "READY...SET...GO";
            break;

    }

    context.fillText(out_text, centerX, 280);


}

function showIntro() {

    var touchtext = '<i class="material-icons" style="color: rgb(~c~)">&#xE913;</i> ';

    var html = "<div class='title'>Tap or Not?</div><div>"
             + touchtext.replace("~c~", safe_colors[1])
             + touchtext.replace("~c~", safe_colors[2])
             + touchtext.replace("~c~", safe_colors[3])
             + touchtext.replace("~c~", safe_colors[0])
             + "</div><div style='margin-top: 15px;' id='start'><u>START</u></div>"
             + "<div style='margin-top: 15px;' id='high-score'>HI-SCORE: " + highscore + "</div>"
             + "<div style='font-size: 8px; margin-top: 25px;'>&copy; Copyright 2016</div>";

    canvas.removeEventListener('click', showIntro);
    clearCanvasRegion(0, 0, canvas.width, canvas.height);
    canvas.width = 0;
    canvas.height = 0;

    intro.style.opacity = 1;
    setElementSize(intro, deviceWidth, deviceHeight * .7);
    setElementPos(intro, deviceHeight * .30, 0);
    intro.innerHTML = html;

    var start = document.getElementById('start');
    start.addEventListener("click", startClicked, false);
}

function startClicked() {
    var start = document.getElementById('start');
    start.removeEventListener("click", startClicked);

    difficulty = 0;
    score = 0;
    intro.innerHTML = "";
    intro.style.width = 0;
    intro.style.height = 0;
    canvas.width = deviceWidth;
    canvas.height = deviceHeight;

    setElementPos(canvas, 0, 0);

    newMatchItem();
    playing = true;
    animate();
}

function getScoreItem(animate_triggered) {

    if (score_item.duration <= 0) {
        tap_item.item = "xxx";
        tap_item.duration = -1; // just to trigger generating a new tap item
        getTapItem(false);
        return;
    }

    context.textBaseline = "middle";
    context.textAlign = "center";
    context.fillStyle = "#00FF00";
    context.font = "164px 'Material Icons'";
    context.fillText(score_item.item, centerX, 180);

    if (animate_triggered) {
        score_item.duration--;
    }

}

function getTapItem(animate_triggered) {

    var item_created;

    if (tap_item.items_to_show <= 0) {
        difficulty++;
        newMatchItem();
        return;
    }

    // 1 in 3 chance of being the right item
    // figure out how to have the right item in the wrong color for higher difficulties
    // rotate items for highest difficulties

    if (tap_item.duration <= 0) {

        // check if they should have let it pass
        if (tap_item.item == match_item.item && tap_item.color == match_item.color) {
            console.log("play state of dead...");
            play_state = "DEAD";
            tap_item.item = smileys[0];
            tap_item.color = "255,0,0";
            canvas.removeEventListener('click', itemClicked);

        } else {

            if (play_state == "TAP") {
                canvas.removeEventListener('click', itemClicked);
                play_state = "SCORE";
                score_item.item = scores[0];
                score_item.duration = 4;
                getScoreItem(false);
                updateScore(1);
                return;
            }

            play_state = "TAP";
            tap_item.items_to_show--;

            chance = getRandomInRange(1, 6);
            item_created = false;

            if (difficulty > 2) {
                if (getRandomInRange(1, 2) == 2) {
                    tap_item.item = match_item.item;
                    if (getRandomInRange(1, 2) == 2) {
                        tap_item.color = match_item.color;
                    } else {
                        tap_item.color = getColor();
                    }
                    item_created = true;
                }
                tap_item.duration = (14 - difficulty) > 9 ? 14 - difficulty : 9;
            } else if (difficulty > 1) {
                if (getRandomInRange(1, 3) == 3) {
                    tap_item.item = match_item.item;
                    tap_item.color = match_item.color;
                    item_created = true;
                }
                tap_item.duration = 14;
            } else {
                if (getRandomInRange(1, 3) == 3) {
                    tap_item.item = match_item.item;
                    tap_item.color = match_item.color;
                    item_created = true;
                }
                tap_item.duration = 18;
            }


            if (item_created === false) {
                var itemID = Math.floor(Math.random() * item_length);

                tap_item.item = items[itemID];

                if (difficulty > 1) {
                    if (getRandomInRange(1, 3) == 3) {
                    	tap_item.color = match_item.color;
                    } else {
                        tap_item.color = getColor();
                    }
                } else {
                    // white for early levels
                    tap_item.color = safe_colors[0];
                }
            }

            canvas.addEventListener('click', itemClicked, false);
        }
    }

    drawCurrentTapItem();

    if (animate_triggered) {
        tap_item.duration--;
    }
}

function drawCurrentTapItem() {
    if (play_state == "DEAD") {
        context.textBaseline = "middle";
        context.textAlign = "center";
        context.fillStyle = "rgba(" + tap_item.color + ", 1)";
        context.font = "128px 'Material Icons'";
        context.fillText(tap_item.item, centerX, 140);

        context.textAlign = "left";
        context.fillStyle = "#00FFFF";
        context.font = "24px 'VideoGame'";
        context.fillText("GAME OVER", deviceWidth / 2 - (9 * 24) / 2, centerY + 40);

        context.fillStyle = "#00FFFF";
        context.font = "20px 'VideoGame'";
        context.fillText("~ TAP HERE ~", deviceWidth / 2 - (12 * 20) / 2, centerY + 80);
        canvas.addEventListener('click', showIntro, false);
    } else {
        context.textBaseline = "middle";
        context.textAlign = "center";
        context.fillStyle = "rgba(" + tap_item.color + ", 1)";
        context.font = "164px 'Material Icons'";
        context.fillText(tap_item.item, centerX, 180);
    }
}

function itemClicked() {

    console.log("item clicked!");

    if (tap_item.item == match_item.item && tap_item.color == match_item.color) {
        canvas.removeEventListener('click', itemClicked);
        play_state = "SCORE";
        score_item.item = scores[1];
        score_item.duration = 3;
        updateScore(2);
        getScoreItem(false);
    } else {
        console.log("dead!!!!");
        play_state = "DEAD";
        tap_item.item = smileys[0];
        tap_item.color = "255,0,0";
        tap_item.duration = 5;
        getTapItem(false);
    }
}

function newMatchItem() {

    play_state = "MATCH";

    var itemID = Math.floor(Math.random() * item_length);
    var color;
    var duration;

    // we have to initialize the tap item object here
    tap_item = {
        duration: 0
    };

    if (difficulty > 1) {
        color = getColor();
        duration = 3;
        tap_item.items_to_show = 11;
    } else {
        color = safe_colors[0];
        duration = 4;
        tap_item.items_to_show = 7;
    }

    match_item = {
        item: items[itemID],
        color: color,
        warning_total: duration / 3 * (1000 / animate_interval),
        warning_length: duration / 3 * (1000 / animate_interval),
        warning_stage: 0
    }


    console.log(match_item);
}

function updateScore(points) {

    score += points;

    if (score > highscore) {
        localStorage.setItem("highscore", score);
        highscore = score;
    }
}

function getRandomInRange(min, max) {
    return Math.floor(Math.random() * (max -min + 1) + min);
}

function getColor() {
    return safe_colors[Math.floor(Math.random() * safe_colors.length)];
}

function clearCanvasRegion(top, left, w, h) {
    context.clearRect(top, left, w, h);
}

function setElementSize(ele, w, h) {
    ele.style.width = Math.floor(w) + "px";
    ele.style.height = Math.floor(h) + "px";
}

function setElementPos(ele, top, left) {
    ele.style.top = Math.floor(top) + "px";
    ele.style.left = Math.floor(left) + "px";
}
