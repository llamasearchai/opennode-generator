// Mock ora module for Jest
const mockSpinner = {
  start: function(text) {
    if (text) this.text = text;
    this.isSpinning = true;
    return this;
  },
  stop: function() {
    this.isSpinning = false;
    return this;
  },
  succeed: function(text) {
    if (text) this.text = text;
    this.isSpinning = false;
    return this;
  },
  fail: function(text) {
    if (text) this.text = text;
    this.isSpinning = false;
    return this;
  },
  warn: function(text) {
    if (text) this.text = text;
    this.isSpinning = false;
    return this;
  },
  info: function(text) {
    if (text) this.text = text;
    this.isSpinning = false;
    return this;
  },
  text: '',
  color: 'cyan',
  isSpinning: false,
  clear: function() {
    return this;
  },
  render: function() {
    return this;
  }
};

const ora = function(options) {
  const spinner = Object.create(mockSpinner);
  if (typeof options === 'string') {
    spinner.text = options;
  } else if (options && typeof options === 'object') {
    Object.assign(spinner, options);
  }
  return spinner;
};

module.exports = ora;
module.exports.default = ora; 