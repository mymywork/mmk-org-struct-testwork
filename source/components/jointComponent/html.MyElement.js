export default function(joint, util, V) {

  var Element = joint.dia.Element;
  var ElementView = joint.dia.ElementView;

  joint.dia.Element.define('html.MyElement', {
    size: { width: 200, height: 100 },
    attrs: {
      placeholder: {
        refWidth: '100%',
        refHeight: '100%',
        fill: 'transparent',
        stroke: '#D4D4D4'
      }
    }
  }, {
    markup: [{
      tagName: 'rect',
      selector: 'placeholder'
    }],
    htmlMarkup: [{
      tagName: 'div',
      className: 'my-html-element',
      selector: 'htmlRoot',
      groupSelector: 'field',
      style: {
        'position': 'absolute',
        'pointer-events': 'none',
        'user-select': 'none',
      },
      attributes: {
        'data-attribute': 'state'
      },
      children: [{
        tagName: 'label',
        className: 'my-html-element-header',
        groupSelector: 'field',
        textContent: 'Header',
        attributes: {
          'data-attribute': 'header'
        }
      }]
    }]
  },{
    create: function(attrs) {

      var a = new this(attrs);
      return a
    }

  });

  // Custom view for JointJS HTML element that displays an HTML <div></div> above the SVG Element.
  joint.shapes.html.MyElementView = ElementView.extend({

    html: null,

    presentationAttributes: ElementView.addPresentationAttributes({
      position: ['HTML_UPDATE'],
      size: ['HTML_UPDATE'],
      //fields: ['HTML_FIELD_UPDATE']
    }),

    // Run these upon first render
    initFlag: ElementView.prototype.initFlag.concat([
      'HTML_UPDATE',
      //'HTML_FIELD_UPDATE'
    ]),

    confirmUpdate: function() {
      var flags = ElementView.prototype.confirmUpdate.apply(this, arguments);
      if (this.hasFlag(flags, 'HTML_UPDATE')) {
        this.updateHTML();
        flags = this.removeFlag(flags, 'HTML_UPDATE');
      }
      /*if (this.hasFlag(flags, 'HTML_FIELD_UPDATE')) {
        this.updateFields();
        flags = this.removeFlag(flags, 'HTML_FIELD_UPDATE');
      }*/
      return flags;
    },

    onRender: function() {
      this.removeHTMLMarkup();
      this.renderHTMLMarkup();
      return this;
    },

    renderHTMLMarkup: function() {
      //this.model.htmlMarkup[0].attributes.rectId = this.model.attributes.id
      this.model.htmlMarkup[0].children[0].textContent = this.model.attributes.header
      var doc = util.parseDOMJSON(this.model.htmlMarkup, V.namespace.xhtml);
      var html = doc.selectors.htmlRoot;
      //var fields = doc.groupSelectors.field;
      // React on all box changes. e.g. input change
      //html.addEventListener('change', this.onFieldChange.bind(this), false);
      this.paper.htmlContainer.appendChild(doc.fragment);
      this.model.attributes.objHtml = html
      this.html = html;
      //this.fields = fields;
    },

    removeHTMLMarkup: function() {
      var html = this.html;
      if (!html) return;
      this.paper.htmlContainer.removeChild(html);
      this.html = null;
      //this.fields = null;
    },

    updateModel: function() {
      var html = this.html
      console.log('html=',html)
      $(html).find(".my-html-element-header").text(this.model.attributes.header)
    },

    updateHTML: function() {
      var bbox = this.model.getBBox();
      var html = this.html;
      html.style.width = bbox.width + 'px';
      html.style.height = bbox.height + 'px';
      html.style.left = bbox.x + 'px';
      html.style.top = bbox.y + 'px';
    },
    /*
        onFieldChange: function(evt) {
          var input = evt.target;
          var attribute = input.dataset.attribute;
          if (attribute) {
            this.model.prop(['fields', attribute], input.value);
          }
        },

        updateFields: function() {
          this.fields.forEach(function(field) {
            var attribute = field.dataset.attribute;
            var value = this.model.prop(['fields', attribute]);
            switch (field.tagName.toUpperCase()) {
              case 'LABEL':
                field.textContent = value;
                break;
              case 'INPUT':
              case 'SELECT':
                field.value = value;
                if (value) {
                  field.classList.remove('field-empty');
                } else {
                  field.classList.add('field-empty');
                }
                break;
              case 'DIV':
                field.dataset[attribute] = value;
                break;
            }
          }.bind(this));
        },
    */
    onRemove: function() {
      this.removeHTMLMarkup();
    }
  });

}
