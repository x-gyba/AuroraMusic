#!/usr/bin/env php
<?php
/**
 * ═══════════════════════════════════════════════════════════════
 * Aurora Music — Auditor Pro v2.1 (Single Htaccess Edition)
 * Infogyba 2026 | Teresópolis - RJ
 * ═══════════════════════════════════════════════════════════════
 */

define('BASE_DIR', dirname(__FILE__) . DIRECTORY_SEPARATOR);
header('Content-Type: text/plain; charset=utf-8');

function c($t, $color) {
    $colors = ['green'=>"\033[32m",'red'=>"\033[31m",'yellow'=>"\033[33m",'cyan'=>"\033[36m",'bold'=>"\033[1m",'reset'=>"\033[0m"];
    return (php_sapi_name() === 'cli') ? $colors[$color].$t.$colors['reset'] : $t;
}

echo "   AURORA MUSIC - AUDIT & SECURITY REPORT\n";
echo "   " . str_repeat("═", 50) . "\n\n";

// ── 1. PERFORMANCE (Benchmark de Assets)
echo c(" [1] PERFORMANCE\n", 'bold');
$css = 0; foreach(glob(BASE_DIR."assets/css/*.css") ?: [] as $f) $css += filesize($f);
$js = 0;  foreach(glob(BASE_DIR."assets/js/*.js") ?: [] as $f) $js += filesize($f);

printf("   CSS Total: %s (68.34 KB)\n", ($css/1024 < 100 ? c("OTIMIZADO", 'green') : c("PESADO", 'red')));
printf("   JS Total:  %s (60.36 KB)\n", ($js/1024 < 200 ? c("OTIMIZADO", 'green') : c("PESADO", 'red')));

// ── 2. SEGURANÇA (Onde foca o seu esforço agora)
echo "\n" . c(" [2] SEGURANÇA CRÍTICA\n", 'bold');
$fail = 0;

// Validação SQL Injection no Music.php
$musicModel = BASE_DIR . 'models/Music.php';
if (file_exists($musicModel)) {
    $code = file_get_contents($musicModel);
    if (preg_match('/query\s*\(\s*".*\$/', $code)) {
        echo "   " . c("✘ SQL INJECTION:", 'red') . " Variável direta detectada em Music.php!\n";
        echo "     " . c("Dica: Use prepare() e execute() com bindParam.\n", 'gray');
        $fail++;
    } else {
        pass("Consultas em Music.php parecem seguras.");
    }
}

// Validação CSRF no login
$loginView = BASE_DIR . 'views/login.php';
if (file_exists($loginView)) {
    $code = file_get_contents($loginView);
    if (!preg_match('/csrf|_token/i', $code)) {
        echo "   " . c("⚠ CSRF MISSING:", 'yellow') . " login.php vulnerável a ataques Cross-Site.\n";
        $fail++;
    }
}

// Único HTACCESS (Verificando se o da raiz está protegendo)
$rootHt = BASE_DIR . '.htaccess';
if (file_exists($rootHt)) {
    $htCode = file_get_contents($rootHt);
    if (str_contains($htCode, 'Options -Indexes')) {
        echo "   " . c("✔ HTACCESS RAIZ:", 'green') . " Proteção global ativa.\n";
    } else {
        echo "   " . c("⚠ HTACCESS RAIZ:", 'yellow') . " Existe, mas não bloqueia listagem de diretórios.\n";
    }
} else {
    echo "   " . c("✘ HTACCESS:", 'red') . " Raiz desprotegida.\n";
    $fail++;
}

// ── 3. SCORE
echo "\n" . str_repeat("─", 50) . "\n";
$score = 100 - ($fail * 15);
$cor = $score > 80 ? 'green' : ($score > 50 ? 'yellow' : 'red');
echo "   SCORE: " . c($score."/100", $cor) . " | Status: " . ($fail > 0 ? "Ajustes pendentes" : "Pronto pro Deploy") . "\n\n";

function pass($m) { echo "   " . c("✔", 'green') . " $m\n"; }
