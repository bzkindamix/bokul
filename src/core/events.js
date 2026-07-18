/* BOKUL — Olay Sözlüğü
 * Modüller arası TÜM iletişimin isimli sözleşmesi.
 * Yeni olay eklerken buraya kaydet; EventBus bilinmeyen olaya uyarı basar. */
(function (B) {
  B.Events = Object.freeze({
    // Soru akışı
    QUESTION_STARTED:   'question:started',
    STEP_ANSWERED:      'step:answered',      // { stepType, correct, attempt, value }
    STEP_HINT:          'step:hint',          // { stepType, hintLevel }
    QUESTION_COMPLETED: 'question:completed', // { stars, mistakes }

    // Ödül akışı
    XP_GAINED:      'xp:gained',       // { amount, source }
    LEVEL_UP:       'level:up',        // { newLevel, newRank }
    STREAK_CHANGED: 'streak:changed',  // { count, multiplier }
    CHEST_EARNED:   'chest:earned',    // { chestType }
    CHEST_OPENED:   'chest:opened',    // { chestType, item }
    COSMETIC_UNLOCKED: 'cosmetic:unlocked', // { itemId }
    COINS_CHANGED:  'coins:changed',   // { total, delta }

    // İlerleme
    MISSION_COMPLETED: 'mission:completed', // { missionId, stars, xp }
    SECTION_UNLOCKED:  'section:unlocked',
    BOSS_DAMAGED:      'boss:damaged',   // { amount, remaining }
    BOSS_ATTACKED:     'boss:attacked',  // { armorLeft } — sadece Ünite Boss'u
    BOSS_DEFEATED:     'boss:defeated',  // { bossId, tier }
    BOSS_RETREAT:      'boss:retreat',

    // Sistem
    GAME_SAVED:     'game:saved',
    GAME_LOADED:    'game:loaded',
    SCREEN_CHANGED: 'screen:changed',
  });

  // Hızlı doğrulama için ters küme
  B._eventSet = new Set(Object.values(B.Events));
})(window.BOKUL = window.BOKUL || {});
