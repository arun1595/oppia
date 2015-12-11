// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for the learner view transcript.
 *
 * @author sean@seanlip.org (Sean Lip)
 */

// A service that maintains the transcript of the playthrough (i.e., what cards
// are shown, what answers have been given, etc. Note that this service does
// not maintain the currently-active card -- it's more like a log of what the
// learner has 'discovered' so far.
oppia.factory('playerTranscriptService', ['$log', function($log) {
  // Each element of this array represents a 'card' in the learner view,
  // represented as a JavaScript object with the following keys:
  // - stateName: the name of the state
  // - newParameterValues: a list of objects representing parameter changes.
  //   Each object has two keys:
  //   - parameterName: the name of the parameter
  //   - parameterValue: the new value of the parameter
  // - contentHtml: the HTML representing the non-interactive content, i.e.
  //     what Oppia first says to the learner before asking for a response
  // - interactionHtml: the HTML representing the interaction
  // - answerFeedbackPairs: a list of objects, each with two keys:
  //   - learnerAnswer: the JS representation of the learner's answer
  //   - oppiaFeedbackHtml: the HTML representation of Oppia's response to this
  //       answer, or null if no response was given

  var transcript = [];

  return {
    loadFromOldTranscript: function(oldTranscript) {
      transcript = angular.copy(oldTranscript);
    },
    addNewCard: function(stateName, newParameterValues, contentHtml, interactionHtml) {
      transcript.push({
        stateName: stateName,
        newParameterValues: newParameterValues,
        contentHtml: contentHtml,
        interactionHtml: interactionHtml,
        answerFeedbackPairs: []
      });
    },
    addNewAnswerFeedbackPair: function(answer, feedbackHtml) {
      transcript[transcript.length - 1].answerFeedbackPairs.push({
        learnerAnswer: answer,
        oppiaFeedbackHtml: feedbackHtml
      });
    },
    getCardByIndex: function(index) {
      if (index >= transcript.length) {
        $log.error(
          'Requested card with index ' + index +
          ', but transcript only has length ' + transcript.length + ' cards.');
      }
      return angular.copy(transcript[index]);
    }
  };
}]);
