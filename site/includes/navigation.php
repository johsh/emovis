<?
$folder = str_replace("/Volumes/Data/Users/rielc/Code/emovis/site/", "", getcwd());
?>

<div class="wrapper" style="position:fixed;width:100%;z-index:1;">
    <div class="container" id="navigation" style="margin:auto;">
        <ul id="select" class="six columns">
            <li <?=($folder == "introduction") ? "class=\"active\"" : ""?>><a id="introduction" href="../introduction/">Introduction</a></li>
            <li <?=($folder == "participate") ? "class=\"active\"" : ""?>><a href="../participate/">Participate</a></li>
            <li <?=($folder == "gallery") ? "class=\"active\"" : ""?>><a href="../gallery/">Gallery</a></li>
            <li <?=($folder == "about") ? "class=\"active\"" : ""?>><a href="../about/">About</a></li>
            <li><a class="screenshot" href="#">Save Image</a></li>
        </ul>
    </div>
</div>