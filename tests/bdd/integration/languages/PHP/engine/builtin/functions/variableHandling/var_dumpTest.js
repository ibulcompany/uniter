/*
 * Uniter - JavaScript PHP interpreter
 * Copyright 2013 Dan Phillimore (asmblah)
 * http://asmblah.github.com/uniter/
 *
 * Released under the MIT license
 * https://github.com/asmblah/uniter/raw/master/MIT-LICENSE.txt
 */

/*global define */
define([
    '../../../tools',
    '../../../../tools',
    'js/util'
], function (
    engineTools,
    phpTools,
    util
) {
    'use strict';

    describe('PHP Engine var_dump() builtin function integration', function () {
        var engine;

        function check(scenario) {
            engineTools.check(function () {
                return {
                    engine: engine
                };
            }, scenario);
        }

        beforeEach(function () {
            engine = phpTools.createEngine();
        });

        describe('when given no arguments', function () {
            check({
                code: '<?php return var_dump();',
                expectedResult: null,
                expectedStderr: 'PHP Warning: var_dump() expects at least 1 parameter, 0 given',
                expectedStdout: ''
            });
        });

        describe('when given one argument', function () {
            util.each({
                'empty array': {
                    value: 'array()',
                    expectedStdout: util.heredoc(function (/*<<<EOS
array(0) {
}

EOS
*/) {})
                },
                'array with one element with implicit key': {
                    value: 'array(7)',
                    expectedStdout: util.heredoc(function (/*<<<EOS
array(1) {
  [0]=>
  int(7)
}

EOS
*/) {})
                },
                'array with one element with explicit key': {
                    value: 'array(4 => "a")',
                    expectedStdout: util.heredoc(function (/*<<<EOS
array(1) {
  [4]=>
  string(1) "a"
}

EOS
*/) {})
                },
                'array with one element with explicit key for subarray value': {
                    value: 'array(5 => array(6, 7))',
                    expectedStdout: util.heredoc(function (/*<<<EOS
array(1) {
  [5]=>
  array(2) {
    [0]=>
    int(6)
    [1]=>
    int(7)
  }
}

EOS
*/) {})
                },
                'boolean true': {
                    value: 'true',
                    expectedStdout: 'bool(true)\n'
                },
                'boolean false': {
                    value: 'false',
                    expectedStdout: 'bool(false)\n'
                },
                'float': {
                    value: '2.2',
                    expectedStdout: 'float(2.2)\n'
                },
                'integer': {
                    value: '3',
                    expectedStdout: 'int(3)\n'
                },
                'null': {
                    value: 'null',
                    expectedStdout: 'NULL\n'
                },
                'empty stdClass instance': {
                    value: 'new stdClass',
                    expectedStdout: util.heredoc(function (/*<<<EOS
object(stdClass)#1 (0) {
}

EOS
*/) {})
                },
                'stdClass instance with one property': {
                    value: 'new stdClass; $value->prop = 1',
                    expectedStdout: util.heredoc(function (/*<<<EOS
object(stdClass)#1 (1) {
  ["prop"]=>
  int(1)
}

EOS
*/) {})
                },
                'stdClass instance with one property containing another stdClass instance': {
                    value: 'new stdClass; $value->sub = new stdClass; $value->sub->prop = 1',
                    expectedStdout: util.heredoc(function (/*<<<EOS
object(stdClass)#1 (1) {
  ["sub"]=>
  object(stdClass)#2 (1) {
    ["prop"]=>
    int(1)
  }
}

EOS
*/) {})
                },
                'string': {
                    value: '"world"',
                    expectedStdout: 'string(5) "world"\n'
                },
                'stdClass instance with one property referring to itself': {
                    value: 'new stdClass; $value->me = $value',
                    expectedStdout: util.heredoc(function (/*<<<EOS
object(stdClass)#1 (1) {
  ["me"]=>
  *RECURSION*
}

EOS
*/) {})
                },
                'array assigned to an element of itself - should be a copy, so no recursion': {
                    value: 'array(); $value[0] = $value',
                    expectedStdout: util.heredoc(function (/*<<<EOS
array(1) {
  [0]=>
  array(0) {
  }
}

EOS
*/) {})
                },
                'array element with reference to variable': {
                    value: 'array(); $where = "Here"; $value[0] =& $where; $where = "There"',
                    expectedStdout: util.heredoc(function (/*<<<EOS
array(1) {
  [0]=>
  &string(5) "There"
}

EOS
*/) {})
                },
                'reference to variable containing array assigned to an element of itself - should not be a copy, so recurses': {
                    value: 'array(); $value[0] =& $value',
                    expectedStdout: util.heredoc(function (/*<<<EOS
array(1) {
  [0]=>
  &array(1) {
    [0]=>
    *RECURSION*
  }
}

EOS
*/) {})
                },
                'reference to variable containing object assigned to a property of itself': {
                    value: 'new stdClass; $value->prop =& $value',
                    expectedStdout: util.heredoc(function (/*<<<EOS
object(stdClass)#1 (1) {
  ["prop"]=>
  *RECURSION*
}

EOS
*/) {})
                },
                'circular reference from array -> object -> array': {
                    value: 'array(); $object = new stdClass; $value[0] =& $object; $object->prop =& $value',
                    expectedStdout: util.heredoc(function (/*<<<EOS
array(1) {
  [0]=>
  &object(stdClass)#1 (1) {
    ["prop"]=>
    &array(1) {
      [0]=>
      *RECURSION*
    }
  }
}

EOS
*/) {})
                }
            }, function (scenario, description) {
                describe(description, function () {
                    check({
                        code: '<?php $value = ' + scenario.value + '; var_dump($value);',
                        expectedStderr: scenario.expectedStderr || '',
                        expectedStdout: scenario.expectedStdout
                    });
                });
            });
        });
    });
});
