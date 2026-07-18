/* BOKUL — QuestionEngine
 * Soru tipi plugin çatısı. Her tip registerType ile kaydolur:
 *   { generate(params, bias), getSteps(q), validateStep(q, step, answer) }
 * Motor tiplerin içini bilmez — Open/Closed. */
(function (B) {
  const types = new Map();
  const views = new Map(); // tip adı -> görünüm oluşturucu (container, q, opts) => ctl

  B.Question = {
    registerType(name, impl) {
      ['generate', 'getSteps', 'validateStep'].forEach(k => {
        if (typeof impl[k] !== 'function') throw new Error('Soru tipi eksik metod: ' + name + '.' + k);
      });
      types.set(name, impl);
    },

    registerView(name, createFn) { views.set(name, createFn); },
    view(name) {
      const v = views.get(name);
      if (!v) throw new Error('Kayıtsız soru görünümü: ' + name);
      return v;
    },

    type(name) {
      const t = types.get(name);
      if (!t) throw new Error('Kayıtsız soru tipi: ' + name);
      return t;
    },

    /* Üret: adaptif zorluk çarpanı ProgressManager'dan alınır */
    generate(typeName, params, skills) {
      const bias = skills ? B.Progress.difficultyBias(skills) : 0.5;
      const q = B.Question.type(typeName).generate(params || {}, bias);
      q._type = typeName;
      return q;
    },

    steps(q) { return B.Question.type(q._type).getSteps(q); },
    validate(q, step, answer) { return B.Question.type(q._type).validateStep(q, step, answer); },
  };
})(window.BOKUL = window.BOKUL || {});
