<?php

// check for all arguments

if (    !empty($_POST["images"]) &&
        !empty($_POST["emotions"])
        //!empty($_POST["data"])
) {

    // establish the connection
    $mysqli = new mysqli("localhost", "root", "root", "emoviz_survey");

    // die if the connection could not be established
    if ($mysqli->connect_errno) {
        die("Failed to connect to MySQL: (" . $mysqli->connect_errno . ") " . $mysqli->connect_error);
    }

    // get the id of the new entry
    $mysqli->query("INSERT INTO survey (country_id, gender, age) VALUES ('0', 'male', '20')");
    $entryID = mysqli_insert_id($mysqli);

    // inster the values for each emotion via subquery
    foreach ($_POST["emotions"] as $emotion => $parameters) {

        $cols = "";
        $values = "";

        $cols = implode(',', array_keys($parameters));
        foreach ($parameters as $parameter => $value)
        {
            isset($values) ? $values .= ',' : $values = '';
            $values .= '\''.$mysqli->real_escape_string($value).'\'';
        }
        //echo("INSERT INTO emotions (entryID, emotion, ".$cols.") VALUES ('".$entryID."','".$emotion."', ".$values.");");
        $mysqli->query("INSERT INTO emotions (entry_id, emotion, ".$cols.") VALUES ('".$entryID."', '".$emotion."' ".$values.");");
        echo("INSERT INTO emotions (entry_id, emotion, ".$cols.") VALUES ('".$entryID."', '".$emotion."', ".$values.");\n");

    }

    //$mysqli->query("INSERT INTO survey (country_id, gender, age) VALUES ('0', 'male', '20')");


    //$mysqli->query("INSERT INTO emotions (entryID, ".$cols.") VALUES ('".$entryID."', ".$values.")");



    //echo($mysqli->error);
    //$data = $_POST["image"];
    //list($type, $data) = explode(';', $data);
    //list(, $data)      = explode(',', $data);
    //$data = base64_decode($data);

    //mkdir('./images/'.$newID.'/');
    //file_put_contents('./images/'.$entryID.'/image.png', $data);
}

?>