<?php

// establish the connection
$mysqli = new mysqli("localhost", "root", "root", "emoviz_survey");

// die if the connection could not be established
if ($mysqli->connect_errno) {
    die("Failed to connect to MySQL: (" . $mysqli->connect_errno . ") " . $mysqli->connect_error);
}
?>
<html>
<?
require('../includes/standard-head.php');
$result = $mysqli->query("SELECT * FROM survey ORDER BY rand() limit 1");
$row = $result->fetch_assoc();
?>
<body id="teaser" style="background-image: url(../images/<?=$row["id"];?>/image.png);">
<? require('../includes/navigation.php'); ?>
<div class="container">
    <h1 class="sixteen columns" style="text-align: center;">Does <span style="color:#39b54a; font-weight:500;"> anger</span> look <br />like this?</h1>
</div>
</body>
</html>
