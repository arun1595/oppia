// Copyright 2014 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Directive for the rule editor.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.directive('ruleEditor', ['$log', function($log) {
  return {
    restrict: 'E',
    scope: {
      rule: '=',
      answerChoices: '=',
      explorationId: '=',
      states: '=',
      addState: '=',
      widgetHandlerSpecs: '=',
      isTmpRule: '@',
      saveTmpRule: '=',
      saveRule: '=',
      deleteRule: '&',
      isEditable: '='
    },
    templateUrl: 'inline/rule_editor',
    controller: [
      '$scope', '$attrs', 'editorContextService',
      function($scope, $attrs, editorContextService) {
        $scope.RULE_FEEDBACK_SCHEMA = {
          type: 'list',
          items: {
            type: 'html',
            ui_config: {
              size: 'small'
            }
          },
          ui_config: {
            add_element_text: 'Add Feedback Option'
          }
        };

        // This automatically opens the rule description picker if the rule
        // name is null.
        $scope.$watch('rule.definition.name', function(newValue, oldValue) {
          if (newValue === null) {
            $scope.openRuleDescriptionEditorIfNotDefault();
            $scope.openRuleDescriptionPicker();
          }
        });

        $scope.$watch('widgetHandlerSpecs', function(newValue) {
          $scope.allRuleTypes = {};
          for (var i = 0; i < newValue.length; i++) {
            if (newValue[i].name == 'submit') {
              ruleDict = {};
              for (var description in newValue[i].rules) {
                ruleDict[description] = newValue[i].rules[description].classifier;
              }
              $scope.allRuleTypes = ruleDict;
            }
          }
        });

        $scope.isDefaultRule = function() {
          return ($scope.rule.description === 'Default');
        };

        $scope.destChoices = [];
        $scope.$watch('states', function(newValue) {
          // Returns a list of objects, each with an ID and name. These
          // represent all states in alphabetical order, followed by 'END'.
          $scope.destChoices = [];
          var stateNames = Object.keys($scope.states).sort();
          stateNames.push(END_DEST);
          for (var i = 0; i < stateNames.length; i++) {
            $scope.destChoices.push({
              id: stateNames[i],
              text: stateNames[i]
            });
          }
        }, true);

        $scope.activeEditor = null;

        $scope.ruleDestMemento = null;
        $scope.openRuleDestEditor = function() {
          $scope.activeEditor = 'ruleDest';
          $scope.ruleDestMemento = angular.copy($scope.rule.dest);
        };
        $scope.$watch('rule.dest', function(newValue, oldValue) {
          // Note that rule.dest can change if a new rule is added. In this
          // case, the destination editor will not yet have been opened.
          if ($scope.activeEditor === 'ruleDest') {
            $scope.closeRuleDestEditor();
          }
        });
        $scope.closeRuleDestEditor = function() {
          $scope.activeEditor = null;
        };

        $scope.ruleDescriptionMemento = null;
        $scope.ruleDefinitionMemento = null;
        $scope.openRuleDescriptionEditorIfNotDefault = function() {
          if ($scope.isDefaultRule()) {
            return;
          }

          $scope.activeEditor = 'ruleDescription';
          $scope.ruleDescriptionMemento = angular.copy($scope.rule.description);
          $scope.ruleDefinitionMemento = angular.copy($scope.rule.definition);
          $scope.computeRuleDescriptionFragments();
        };
        $scope.closeRuleDescriptionEditor = function() {
          $scope.closeRuleDescriptionPicker();
          $scope.activeEditor = null;
          $scope.ruleDescriptionMemento = null;
          $scope.ruleDefinitionMemento = null;
        };

        $scope.$watch('activeEditor', function(newValue, oldValue) {
          if (oldValue === 'ruleDest') {
            // If a new state has been entered, create it.
            var foundInExistingStateList = false;
            for (var stateName in $scope.states) {
              if (stateName === $scope.rule.dest) {
                foundInExistingStateList = true;
              }
            }

            if (!foundInExistingStateList && $scope.rule.dest !== 'END') {
              try {
                $scope.addState($scope.rule.dest);
              } catch(e) {
                $scope.rule.dest = $scope.ruleDestMemento;
                throw e;
              }
            }
            $scope.ruleDestMemento = null;
          }

          if (oldValue === 'ruleDescription') {
            if ($scope.isTmpRule === 'true' && $scope.rule.definition.name !== null) {
              $scope.saveTmpRule();
            }
          }

          if ($scope.isTmpRule !== 'true') {
            $scope.saveRule();
          }
        });

        $scope.ruleFeedbackEditorIsOpen = false;
        $scope.openRuleFeedbackEditor = function() {
          if ($scope.rule.feedback.length === 0) {
            $scope.rule.feedback.push('');
          }
          $scope.ruleFeedbackEditorIsOpen = true;
        };
        $scope.closeRuleFeedbackEditor = function() {
          if ($scope.isTmpRule !== 'true') {
            $scope.saveRule();
          }
          $scope.ruleFeedbackEditorIsOpen = false;
        };

        $scope.$on('externalSave', function() {
          $scope.closeRuleDescriptionEditor();
          $scope.closeRuleFeedbackEditor();
          $scope.closeRuleDestEditor();
        });

        $scope.getActiveStateName = function() {
          return editorContextService.getActiveStateName();
        };

        $scope.getCssClassForSortHandle = function() {
          return 'oppia-rule-sort-handle ' +
            ($scope.isRuleConfusing() ? 'oppia-rule-sort-handle-warning'
                                      : 'oppia-rule-sort-handle-no-warning');
        };

        $scope.getCssClassForRule = function() {
          var ruleClass = (
            $scope.isRuleConfusing() ? 'oppia-rule-bubble-warning'
                                     : 'oppia-rule-bubble');
          if ($scope.isDefaultRule()) {
            ruleClass += ' oppia-default-rule-header-bubble';
          } else {
            ruleClass += ' oppia-non-default-rule-header-bubble';
          }
          return ruleClass;
        };

        $scope.getEditableCssClassForRuleDescription = function() {
          return $scope.isDefaultRule() ? '' : ' oppia-editable';
        };

        $scope.isRuleConfusing = function() {
          return (
            $scope.rule.feedback.length === 0 &&
            $scope.rule.dest === editorContextService.getActiveStateName());
        };

        $scope.ruleDescriptionPickerIsOpen = false;
        $scope.openRuleDescriptionPicker = function() {
          $scope.ruleDescriptionPickerIsOpen = true;
        };
        $scope.closeRuleDescriptionPicker = function() {
          $scope.ruleDescriptionPickerIsOpen = false;
        };

        $scope.selectNewRuleType = function(description, name) {
          $scope.rule.description = description;
          $scope.rule.definition.name = name;
          $scope.rule.definition.inputs = {};

          // Finds the parameters and sets them in $scope.rule.definition.inputs.
          var pattern = /\{\{\s*(\w+)\s*(\|\s*\w+\s*)?\}\}/;
          var copyOfRule = description;
          while (true) {
            if (!copyOfRule.match(pattern)) {
              break;
            }
            var varName = copyOfRule.match(pattern)[1];
            var varType = null;
            if (copyOfRule.match(pattern)[2]) {
              varType = copyOfRule.match(pattern)[2].substring(1);
            }

            if (varType == 'Set') {
              $scope.rule.definition.inputs[varName] = [];
            } else if (varType == 'NonnegativeInt') {
              // Set a default value.
              $scope.rule.definition.inputs[varName] = 0;
            } else {
              $scope.rule.definition.inputs[varName] = '';
            }

            copyOfRule = copyOfRule.replace(pattern, ' ');
          }

          $scope.closeRuleDescriptionPicker();
        };


        // TODO(sll): Remove the need for this special case for multiple-choice
        // input.
        $scope.choices = null;
        var isMultipleChoice = false;
        $scope.$watch('answerChoices', function(newValue, oldValue) {
          if (newValue) {
            $scope.choices = angular.copy(newValue);
            isMultipleChoice = true;
          } else {
            $scope.choices = null;
            isMultipleChoice = false;
          }
        }, true);


        $scope.$watch('rule.description', function() {
          $scope.computeRuleDescriptionFragments();
        }, true);

        $scope.ruleDescriptionFragments = [];
        $scope.computeRuleDescriptionFragments = function() {
          if (!$scope.rule.description) {
            $scope.ruleDescriptionFragments = [];
            return;
          }

          var pattern = /\{\{\s*(\w+)\s*\|\s*(\w+)\s*\}\}/;

          var finalInputArray = $scope.rule.description.split(pattern);
          if (finalInputArray.length % 3 !== 1) {
            $log.error('Could not process rule description.');
          }

          var result = [];
          for (var i = 0; i < finalInputArray.length; i += 3) {
            result.push({'type': 'noneditable', 'text': finalInputArray[i]});
            if (i == finalInputArray.length - 1) {
              break;
            }

            if (isMultipleChoice) {
              result.push({'type': 'select', 'varName': finalInputArray[i+1]});
            } else {
              result.push({
                'type': finalInputArray[i+2],
                'varName': finalInputArray[i+1]
              });
            }
          }
          $scope.ruleDescriptionFragments = result;
        };

        $scope.getEscapedDest = function() {
          return encodeURIComponent($scope.rule.dest);
        };

        $scope.getExtendedChoiceArray = function(choices) {
          var result = [];
          for (var i = 0; i < choices.length; i++) {
            result.push({id: i, val: choices[i]});
          }
          return result;
        };
      }
    ]
  };
}]);
