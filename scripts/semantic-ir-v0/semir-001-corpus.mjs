// Human-authored qualification requirements. These are semantic expectations, not serialized IR.
const corpusEntries = [
  ['SEMIR-001-001','Users export reports.','semantic','context-free',['assertion','action','actor','object'],[],['permission','obligation']],
  ['SEMIR-001-002','Users may export reports.','semantic','context-free',['permission','action','actor','object'],[],['assertion','obligation']],
  ['SEMIR-001-003','Users must export reports.','semantic','context-free',['obligation','action','actor','object'],[],['permission','recommendation']],
  ['SEMIR-001-004','Users must not export reports.','semantic','context-free',['prohibition','action','actor','object','negative'],[],['obligation','permission']],
  ['SEMIR-001-005','Users should export reports.','semantic','context-free',['recommendation','action','actor','object'],[],['obligation']],
  ['SEMIR-001-006','Reports may contain personal information.','semantic','context-free',['possibility','attribute','object'],[],['permission']],
  ['SEMIR-001-007','Approval may be required before processing.','semantic','context-free',['possibility','obligation','nested-modality','temporal-before','missing-condition'],['condition: applicability determinant','known: approval requirement may apply','question: when is approval required?'],['unconditional obligation','permission','invented condition']],
  ['SEMIR-001-008','Orders require approval.','semantic','context-free',['obligation','action','object','unconditional'],[],['condition']],
  ['SEMIR-001-009','International orders require approval.','semantic','context-free',['obligation','condition','scope-category'],[],['unconditional']],
  ['SEMIR-001-010','Orders above Rp1,000,000 require approval.','semantic','context-free',['obligation','condition','threshold','quantity'],[],['trigger']],
  ['SEMIR-001-011','Orders may require approval.','semantic','context-free',['possibility','obligation','nested-modality','missing-condition'],['condition: applicability determinant'],['unconditional obligation']],
  ['SEMIR-001-012','Users can cancel orders.','semantic','context-free',['permission','action','positive'],[],['prohibition']],
  ['SEMIR-001-013','Users cannot cancel orders.','semantic','context-free',['prohibition','action','negative'],[],['permission']],
  ['SEMIR-001-014','Users are not required to cancel orders.','semantic','context-free',['obligation','negative','action'],[],['prohibition','permission']],
  ['SEMIR-001-015','When payment succeeds, the system sends a receipt.','semantic','context-free',['trigger','action','actor','object'],[],['condition']],
  ['SEMIR-001-016','Each order contains at least one item.','semantic','context-free',['relation','minimum','cardinality','per-item scope'],[],[]],
  ['SEMIR-001-017','A customer may purchase no more than 2 products per order.','semantic','context-free',['permission','maximum','quantity','per-order scope'],[],[]],
  ['SEMIR-001-018','Discounts range from 5% to 20%.','semantic','context-free',['assertion','range','quantity'],[],[]],
  ['SEMIR-001-019','The order is pending payment.','semantic','context-free',['state','assertion'],[],[]],
  ['SEMIR-001-020','When payment succeeds, the order becomes paid.','semantic','context-free',['trigger','state-transition','outcome'],[],[]],
  ['SEMIR-001-021','The user submits a request.','semantic','context-free',['action','actor','object'],[],[]],
  ['SEMIR-001-022','A request is submitted.','semantic','context-free',['action','object','missing-actor'],['actor: unspecified'],['invented actor']],
  ['SEMIR-001-023','The merchant owns the store and can update its profile.','semantic','context-free',['multi-proposition','relation','permission','action'],[],[]],
  ['SEMIR-001-024','The system validates the order and sends a confirmation email.','semantic','context-free',['multi-proposition','action','object'],[],[]],
  ['SEMIR-001-025','A user has one profile.','semantic','context-free',['relation','one-to-one','cardinality'],[],[]],
  ['SEMIR-001-026','An order has one or more line items.','semantic','context-free',['relation','one-to-many','minimum','cardinality'],[],[]],
  ['SEMIR-001-027','The shipment is delivered.','semantic','context-free',['state','assertion'],[],[]],
  ['SEMIR-001-028','Send the receipt.','semantic','context-free',['action','missing-actor','object'],['actor: unspecified'],['invented actor']],
  ['SEMIR-001-029','The system records it.','needs_review','context-dependent',['ambiguous-reference'],['referent: it','question: what is recorded?'],['safe proposition']],
  ['SEMIR-001-030','Notify the user after approval.','semantic','context-free',['action','temporal-after','missing-actor'],['actor: unspecified'],[]],
  ['SEMIR-001-031','The system sends a notification when appropriate.','semantic','context-free',['action','missing-trigger'],['trigger: appropriateness criterion'],['invented trigger']],
  ['SEMIR-001-032','The service provides a discount above the threshold.','semantic','context-free',['action','missing-threshold'],['threshold: value unspecified'],['invented threshold']],
  ['SEMIR-001-033','The system stores the result.','semantic','context-free',['action','missing-timing'],['timing: unspecified'],[]],
  ['SEMIR-001-034','When payment fails, the system updates the order and sends a notification.','semantic','context-free',['trigger','multi-proposition','action','missing-outcome'],['outcome: resulting order state unspecified'],[]],
  ['SEMIR-001-035','For example, an order worth Rp150,000 receives free shipping.','semantic','context-free',['example','action','threshold'],[],['universal rule']],
  ['SEMIR-001-036','This feature is intended to reduce checkout abandonment.','semantic','context-free',['rationale','goal'],[],['system obligation']],
  ['SEMIR-001-037','See section 3.4 for fraud handling.','semantic','context-free',['reference'],[],['fraud-handling behavior']],
  ['SEMIR-001-038','4.2 Approval Process','non_semantic','context-free',['heading'],[],['semantic proposition']],
  ['SEMIR-001-039','Table 7','non_semantic','context-free',['label'],[],['semantic proposition']],
  ['SEMIR-001-040','The applicant submits it.','needs_review','context-dependent',['ambiguous-reference','missing-object'],['referent: it','question: what does it refer to?'],['resolved object']],
  ['SEMIR-001-041','An order is a purchase request submitted by a customer.','semantic','context-free',['definition','relation','actor','object'],[],['unrelated workflow obligation']],
  ['SEMIR-001-042','Selected orders require approval.','semantic','context-dependent',['obligation','missing-scope','action','object'],['scope: selection criterion unspecified','question: which orders are selected?'],['unconditional obligation','invented selection criterion']],
  ['SEMIR-001-043','The system sends a notification to the customer with an expired token.','semantic','context-dependent',['action','actor','object','ambiguous-attachment'],['attachment: expired token may qualify the customer or the sending action','question: what does the expired token qualify?'],['resolved attachment','invented authentication outcome']],
];

// Each phrase is a human-authored semantic expectation, not an extraction rule or serialized IR value.
const propositionExpectations = {
  'SEMIR-001-001': ['users export reports'], 'SEMIR-001-002': ['users are permitted to export reports'], 'SEMIR-001-003': ['users are required to export reports'], 'SEMIR-001-004': ['users are prohibited from exporting reports'], 'SEMIR-001-005': ['users are recommended to export reports'], 'SEMIR-001-006': ['reports can contain personal information'], 'SEMIR-001-007': ['approval can be required before processing'], 'SEMIR-001-008': ['orders require approval'], 'SEMIR-001-009': ['international orders require approval'], 'SEMIR-001-010': ['orders above the stated amount require approval'], 'SEMIR-001-011': ['orders can require approval'], 'SEMIR-001-012': ['users are permitted to cancel orders'], 'SEMIR-001-013': ['users are prohibited from cancelling orders'], 'SEMIR-001-014': ['users have no obligation to cancel orders'], 'SEMIR-001-015': ['payment success triggers sending a receipt'], 'SEMIR-001-016': ['each order contains at least one item'], 'SEMIR-001-017': ['a customer may purchase at most two products per order'], 'SEMIR-001-018': ['discounts are between five and twenty percent'], 'SEMIR-001-019': ['the order is pending payment'], 'SEMIR-001-020': ['payment success changes the order to paid'], 'SEMIR-001-021': ['the user submits a request'], 'SEMIR-001-022': ['an unspecified actor submits a request'], 'SEMIR-001-023': ['the merchant owns the store', 'the merchant is permitted to update the store profile'], 'SEMIR-001-024': ['the system validates the order', 'the system sends a confirmation email'], 'SEMIR-001-025': ['a user has one profile'], 'SEMIR-001-026': ['an order has one or more line items'], 'SEMIR-001-027': ['the shipment is delivered'], 'SEMIR-001-028': ['an unspecified actor sends the receipt'], 'SEMIR-001-030': ['an unspecified actor notifies the user after approval'], 'SEMIR-001-031': ['the system sends a notification when an unspecified criterion is met'], 'SEMIR-001-032': ['the service provides a discount above an unspecified threshold'], 'SEMIR-001-033': ['the system stores the result at an unspecified time'], 'SEMIR-001-034': ['payment failure causes the system to update the order', 'payment failure causes the system to send a notification'], 'SEMIR-001-035': ['the stated order is an example of free shipping'], 'SEMIR-001-036': ['the feature has the rationale of reducing checkout abandonment'], 'SEMIR-001-037': ['the source references section 3.4 for fraud handling'], 'SEMIR-001-041': ['an order is defined as a customer-submitted purchase request'], 'SEMIR-001-042': ['selected orders require approval'], 'SEMIR-001-043': ['the system sends a notification to the customer'],
};

export const corpus = corpusEntries.map(([id, source, disposition, context, dimensions, unresolved, prohibited]) => ({
  id, source: { text: source, authorization: 'human-authored non-confidential qualification fixture' },
  expected: { sourceDisposition: disposition, contextClassification: context, dimensions, unresolved, prohibitedInterpretations: prohibited,
    propositions: propositionExpectations[id] ?? [], evidenceExpectations: [{ sourceSlot: id, quote: source }] },
}));

export const coverage = {
  'basic proposition structure': ['SEMIR-001-021','SEMIR-001-022','SEMIR-001-025','SEMIR-001-027'],
  'all six semantic forces': ['SEMIR-001-001','SEMIR-001-003','SEMIR-001-002','SEMIR-001-004','SEMIR-001-006','SEMIR-001-005'],
  'polarity': ['SEMIR-001-012','SEMIR-001-013','SEMIR-001-014'],
  'conditions and triggers': ['SEMIR-001-010','SEMIR-001-015','SEMIR-001-031'],
  'quantity and scope': ['SEMIR-001-016','SEMIR-001-017','SEMIR-001-018','SEMIR-001-032'],
  'state semantics': ['SEMIR-001-019','SEMIR-001-020','SEMIR-001-034'],
  'relations and cardinality': ['SEMIR-001-023','SEMIR-001-025','SEMIR-001-026'],
  'epistemic incompleteness': ['SEMIR-001-007','SEMIR-001-022','SEMIR-001-028','SEMIR-001-029','SEMIR-001-030','SEMIR-001-031','SEMIR-001-032','SEMIR-001-033','SEMIR-001-034','SEMIR-001-040'],
  'discourse and source accounting': ['SEMIR-001-035','SEMIR-001-036','SEMIR-001-037','SEMIR-001-038','SEMIR-001-039'],
  'multi-proposition': ['SEMIR-001-023','SEMIR-001-024','SEMIR-001-034'],
  'context classification': ['SEMIR-001-001','SEMIR-001-029','SEMIR-001-040'],
};

// §13 member-level matrix: this is intentionally more specific than the broad family map above.
export const requiredMembers = {
  'simple action': ['SEMIR-001-021'], 'action with actor': ['SEMIR-001-001'], 'action without explicit actor': ['SEMIR-001-028'], 'action with object': ['SEMIR-001-021'], 'relation between entities': ['SEMIR-001-023'], 'definition': ['SEMIR-001-041'], 'attribute assertion': ['SEMIR-001-006'],
  assertion: ['SEMIR-001-001'], obligation: ['SEMIR-001-003'], permission: ['SEMIR-001-002'], prohibition: ['SEMIR-001-004'], possibility: ['SEMIR-001-006'], recommendation: ['SEMIR-001-005'], 'nested possibility + obligation': ['SEMIR-001-007'],
  'positive assertion': ['SEMIR-001-012'], 'negative assertion': ['SEMIR-001-013'], 'negative obligation/prohibition distinction': ['SEMIR-001-013','SEMIR-001-014'],
  'explicit condition': ['SEMIR-001-009'], 'explicit trigger': ['SEMIR-001-015'], 'condition + obligation': ['SEMIR-001-010'], 'trigger + action': ['SEMIR-001-015'], 'missing condition': ['SEMIR-001-011'], 'missing trigger': ['SEMIR-001-031'],
  maximum: ['SEMIR-001-017'], minimum: ['SEMIR-001-016'], range: ['SEMIR-001-018'], threshold: ['SEMIR-001-010'], 'per-item/per-order scope': ['SEMIR-001-016','SEMIR-001-017'], 'missing threshold': ['SEMIR-001-032'],
  'state assertion': ['SEMIR-001-019'], 'state transition': ['SEMIR-001-020'], 'trigger causing state transition': ['SEMIR-001-020'], 'missing resulting state': ['SEMIR-001-034'],
  'one-to-one': ['SEMIR-001-025'], 'one-to-many': ['SEMIR-001-026'], 'bounded cardinality': ['SEMIR-001-017'], 'ownership/association': ['SEMIR-001-023'],
  'missing actor': ['SEMIR-001-022'], 'missing object': ['SEMIR-001-040'], 'missing condition': ['SEMIR-001-011'], 'missing trigger': ['SEMIR-001-031'], 'missing threshold': ['SEMIR-001-032'], 'missing scope': ['SEMIR-001-042'], 'missing timing': ['SEMIR-001-033'], 'missing outcome': ['SEMIR-001-034'], 'ambiguous reference': ['SEMIR-001-029'], 'ambiguous attachment': ['SEMIR-001-043'],
  example: ['SEMIR-001-035'], rationale: ['SEMIR-001-036'], reference: ['SEMIR-001-037'], heading: ['SEMIR-001-038'], 'numbering/label': ['SEMIR-001-039'], 'genuinely non-semantic source': ['SEMIR-001-038','SEMIR-001-039'],
};
