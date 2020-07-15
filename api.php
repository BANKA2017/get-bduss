<?php
/* KDboT
 * @banka2017 & KD·NETWORK
 */

//$origin = "";
header('content-type: application/json;charset=UTF-8');
header('access-control-allow-origin: '. (isset($origin)) ? $origin : '*');
header('access-control-allow-methods: GET');
header('X-XSS-Protection: 1; mode=block');
header('X-Frame-Options: sameorigin');
$get = $_GET;
$r = ["errno" => -1, "msg" => "Forbidden", "data" => []];
if (isset($get["m"])) {
    switch($get["m"]){
        case "getqrcode":
            $r["data"] = getBDUSS::getqrcode();
            if($r["data"]["sign"]){
                $r["errno"] = 0;
                $r["msg"] = "Success";
            }
            break;
        case "getbduss":
            if(isset($get["sign"]) && $get["sign"] != ""){
                $r["data"] = getBDUSS::get_real_bduss($get["sign"]);
                if($r["data"]){
                    $r["errno"] = 0;
                    $r["msg"] = "Success";
                }
            } else {
                $r["msg"] = "Invalid QR Code or timeout";
            }
            break;
    }
}
echo json_encode($r, JSON_UNESCAPED_UNICODE);

class getBDUSS{
    private function scurl (string $url = "localhost", int $timeout = 60, bool $headOnly = false) :string {
        $ch = curl_init();
        curl_setopt($ch,CURLOPT_URL, $url);
        curl_setopt($ch,CURLOPT_USERAGENT,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.78 Safari/537.36');
        curl_setopt($ch,CURLOPT_HEADER, $headOnly);
        curl_setopt($ch,CURLOPT_NOBODY, $headOnly);
        curl_setopt($ch,CURLOPT_TIMEOUT, $timeout);
        curl_setopt($ch,CURLOPT_RETURNTRANSFER, true);
        return curl_exec($ch);
    }
    public function getqrcode() :array {
        $resp = ["sign" => null, "imgurl" => null];
        $get_qrcode = json_decode(self::scurl("https://passport.baidu.com/v2/api/getqrcode?lp=pc"), true);
        if(isset($get_qrcode["imgurl"]) && isset($get_qrcode["sign"])){
            $resp = ["sign" => $get_qrcode["sign"], "imgurl" => $get_qrcode["imgurl"]];
        }
        return $resp;
    }
    public function get_real_bduss(string $sign) :array{
        //status code
        //errno不等于0或1时需要要求更换二维码及sign
        //-1 更换二维码
        //0 进入下一步
        //1 无需操作
        //2 已确认
        $r = ["status" => 1, "bduss" => "", "msg" => ""];
        $response = self::scurl("https://passport.baidu.com/channel/unicast?channel_id={$sign}&callback=", 35);
        if ($response) {
            $responseParse = json_decode(str_replace(array("(",")"),'',$response),true);
            if(!$responseParse["errno"]){
                $channel_v = json_decode($responseParse["channel_v"],true);
                if($channel_v["status"]){
                    $r["status"] = 0;
                    $r["msg"] = "Continue";
                }else{
                    $s_bduss = self::scurl('https://passport.baidu.com/v3/login/main/qrbdusslogin?bduss='.$channel_v["v"], 10, true);
                    if (preg_match('/BDUSS=([\w\-~=]+);/', $s_bduss, $bduss)) {
                        $r["status"] = 2;
                        $r["msg"] = "Success";
                        $r["bduss"] = $bduss[1];
                    }
                }
            }else{
                $r["status"] = $responseParse["errno"];
            }
        }else{
            $r["status"] = -1;
            $r["msg"] = "Invalid QR Code";
        }
        return $r;
    }
}
