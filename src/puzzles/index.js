"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var clock_1 = require("./clock");
var megaminx_1 = require("./megaminx");
var nnn_1 = require("./nnn");
var puzzleRegister_1 = require("./puzzleRegister");
var pyraminx_1 = require("./pyraminx");
var skewb_1 = require("./skewb");
var square1_1 = require("./square1");
// import { AXIS } from "./axis";
// import { WINDMILL } from "./windmill";
// import { FISHER } from "./fisher";
// import { IVY } from "./ivy";
// import { MIRROR } from "./mirror";
// import { DINO } from "./dino";
// import { REX } from "./rex";
// import { REDI } from "./redi";
// import { MIXUP } from "./mixup";
// import { PYRAMORPHIX } from "./pyramorphix";
// import { GEAR } from "./gear";
// import { DREIDEL } from "./dreidel";
// import { BDG } from "./bandaged222";
// import { BICUBE } from "./bicube";
// import { SQUARE2 } from "./square2";
// import { PANDORA } from "./pandora";
// import { ULTIMATE_SKEWB } from "./ultimateSkewb";
// import { PYRAMINX_CRYSTAL } from "./pyraminxCrystal";
// import { TETRAMINX } from "./tetraminx";
// import { MEIER_HALPERN_PYRAMIND } from "./meierHalpernPyramind";
// import { SQUARE1_STAR } from "./square1Star";
// import { HELICOPTER } from "./helicopter";
// import { SUPER_SQUARE1 } from "./superSquare1";
// import { FTO } from "./fto";
// import { TIME_MACHINE } from "./timeMachine";
// import { MASTER_SKEWB } from "./masterSkewb";
// import { VOID } from "./void333";
// import { FISHER44 } from "./fisher44";
// import { GHOST } from "./ghost";
// import { BARREL33 } from "./barrel33";
// NxN, Pyraminx, Megaminx, Skewb, Square-1, Clock
(0, puzzleRegister_1.registerPuzzle)("rubik", "Rubik", nnn_1.RUBIK, true);
(0, puzzleRegister_1.registerPuzzle)("pyraminx", "Pyraminx", pyraminx_1.PYRAMINX, true);
(0, puzzleRegister_1.registerPuzzle)("megaminx", "Megaminx", megaminx_1.MEGAMINX, true);
(0, puzzleRegister_1.registerPuzzle)("skewb", "Skewb", skewb_1.SKEWB, false);
(0, puzzleRegister_1.registerPuzzle)("square1", "Square One", square1_1.SQUARE1, false);
(0, puzzleRegister_1.registerPuzzle)("clock", "Rubik's clock", clock_1.CLOCK, false);
// NxN Mods
// registerPuzzle("mirror", "Mirror", MIRROR, true);
// registerPuzzle("void", "Void Cube", VOID, false);
// registerPuzzle("windmill", "Windmill", WINDMILL, false);
// registerPuzzle("fisher", "Fisher", FISHER, false);
// registerPuzzle("fisher44", "Fisher 4x4", FISHER44, false);
// registerPuzzle("axis", "Axis", AXIS, false);
// registerPuzzle("pandora", "Pandora", PANDORA, false);
// registerPuzzle("mixup", "Mixup", MIXUP, false);
// registerPuzzle("barrel33", "Barrel 3x3", BARREL33, false);
// registerPuzzle("gear", "Gear", GEAR, false);
// registerPuzzle("dreidel", "Dreidel", DREIDEL, false);
// registerPuzzle("ghost", "Ghost", GHOST, false);
// registerPuzzle("timemachine", "Time Machine", TIME_MACHINE, false);
// registerPuzzle("bandaged222", "Bandaged 2x2x2", BDG, false);
// registerPuzzle("bicube", "Bicube", BICUBE, false);
// Pyraminx Mods
// registerPuzzle("pyramorphix", "Pyramorphix", PYRAMORPHIX, false);
// registerPuzzle("tetraminx", "Tetraminx", TETRAMINX, false);
// registerPuzzle("meierHalpernPyramid", "Meier-Halpern Pyramid", MEIER_HALPERN_PYRAMIND, false);
// Megaminx Mods
// registerPuzzle("pyraminxCrystal", "Pyraminx Crystal", PYRAMINX_CRYSTAL, false);
// Skewb Mods
// registerPuzzle("ultimateSkewb", "Ultimate Skewb", ULTIMATE_SKEWB, false);
// registerPuzzle("masterskewb", "Master Skewb", MASTER_SKEWB, false);
// Square-1 Mods
// registerPuzzle("square2", "Square Two", SQUARE2, false);
// registerPuzzle("supersquare1", "Super Square-1", SUPER_SQUARE1, false);
// registerPuzzle("sq1Star", "Square-1 Star", SQUARE1_STAR, false);
// Clock Mods
// Others
// registerPuzzle("ivy", "Ivy", IVY, false);
// registerPuzzle("dino", "Dino", DINO, false);
// registerPuzzle("rex", "Rex", REX, false);
// registerPuzzle("redi", "Redi", REDI, false);
// registerPuzzle("helicopter", "Helicopter", HELICOPTER, false);
// registerPuzzle("fto", "FTO", FTO, false);
