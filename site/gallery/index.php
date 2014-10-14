<?php

// establish the connection
$mysqli = new mysqli("localhost", "root", "root", "emoviz_survey");

// die if the connection could not be established
if ($mysqli->connect_errno) {
    die("Failed to connect to MySQL: (" . $mysqli->connect_errno . ") " . $mysqli->connect_error);
}
?>
<html>
<? require('../includes/standard-head.php'); ?>
<body>
<? require('../includes/navigation.php'); ?>
<div class="container">
    <p class="sixteen columns">
        A selection of visualized emotions
    </p>
    <div class="sixteen columns" style="margin-top:80px;">
<?
if ($result = $mysqli->query("SELECT * FROM survey")) {
    $count = 0;
    while ($row = $result->fetch_assoc()) {
        ?>
    <a href="../images/<?=$row["id"];?>/image.png" class="gallery-preview four columns <?= (($count%4)==0 ?'alpha':'')?> <?=(($count%4) == 3 ? 'omega': '')?>">
        <span class="thumbnail" style="background-image:url(../images/<?=$row["id"];?>/image.png)"></span>
        <span class="text">Submitted by a <?=$row["age"];?> years old <?=$row["gender"];?></span>
    </a>
    <?
        $count++;
    }
    $result->free();
}
?>
    </div>
</div>
</body>
</html>
