import React from 'react'
//import { connect } from 'react-redux'
import * as joint from 'jointjs'
import $ from 'jquery'
import ui from 'jquery-ui'
import uicontextmenu from 'ui-contextmenu'
import htmlMyElementConstructor from './jointComponent/html.MyElement'

// Нужно для jointjs чтобы т.к он использует jquery.
global.jQuery = $
global.$ = $
// Нужно для самого jointjs чтобы он видел себя глобально.
global.joint = joint

const g = joint.g
const V = joint.V

class DiagramFlow extends React.Component {


  constructor() {
    super();

    // константы.
    this.rows = 3
    this.cols = 5

    this.c = 30     // corner

    this.thick = 30 // толщина заголовков

    this.h = 100
    this.w = 200
    this.s = 50     // space

    this.list = [
      [
        {
          id: 1,
          name: 'Руководитель'
        }
      ],
      [
        {
          id: 2,
          name: 'Управления строительства'
        }, {
          id: 3,
          name: 'Финансовое управление'
        }
      ],
      [
        {
          id: 4,
          name: 'Отдел механизации'
        },
        {
          id: 5,
          name: 'Отдел снабжения'
        },
        {
          id: 6,
          name: 'Отдел финансового планирования'
        },
        {
          id: 7,
          name: 'Расчетный отдел'
        }
      ]
    ]

    this.links = [
        [1,2],
        [1,3],
        [2,4],
        [2,5],
        [3,6],
        [3,7]
    ]

    this.state = this.calculateHeaders()

  }

  componentDidMount() {

    const { modal } = this.props

    var self = this

    var graph = new joint.dia.Graph
    this.graph = graph
    /*
      Класс линка есть joint.shapes.standard.Link
      joint.shapes.devs.Link - используется с портами, но можно и так вроде
      joint.dia.Link - основной коренной от него все наследуются.
     */

    var linkDef = new joint.dia.Link({
      attrs: {
        line: {
        }
      },
      typeOfConnection: 'out',
      connector: { name: 'rounded' },
      //router: { name: 'manhattan' }
    })

    // алгоритм огибания блоков
    linkDef.router('metro' , {
      excludeTypes: ['my.SelectRectangle']
    })

    // marker-source - это точка подсоединения к блоку исходная описывается в svg
    linkDef.attr({
      //'.marker-source': { d: 'M 0 10 m 0 -5  a 5 5 0 1 0 0 1', 'stroke-width': 0, fill: '#232E78' },
      '.marker-target': { d: 'M 10 -5 10 5 0 0 z', 'stroke-width': 0, fill: '#232E78' }

    })

    let menu = document.getElementById('menu')
    let paperBlock = document.getElementById('paper')
    let root = document.getElementById('root')
    console.log('Paper ', root,'width = ', root.clientWidth, ' height = ', root.clientHeight)
    /*
     * PAPER
     */
    var paper = new joint.dia.Paper({
      el: paperBlock,
      model: graph,
      width: root.clientWidth,
      height: root.clientHeight/*-menu.clientHeight*/,
      linkPinning: false,
      defaultLink: linkDef,
      //drawGrid: { name: 'mesh', args: { color: 'grey' }},
      //gridSize: 20,

      interactive: function(cellView) {
        if (cellView.model.isLink()) {
          return {
            remove: true,
            vertexAdd: true,
            vertexRemove: true,
            arrowheadMove: false,
          }
        }
        return {  elementMove: false };
      },

      validateConnection: function (cellViewS, magnetS, cellViewT, magnetT, end, linkView) {
        console.log('cellViewS = ', cellViewS)
        console.log('magnetS = ', magnetS)
        console.log('cellViewT = ', cellViewT)
        console.log(magnetT)
        console.log('end = ', end)
        console.log('linkView = ', linkView)
        console.log('------------------------------')

        // Prevent linking from output ports to input ports within one element.
        if (cellViewS === cellViewT) return false

        delete linkView.model.attributes.source.selector
        delete linkView.model.attributes.target.selector
        // Prevent linking to input ports.
        return true
      }
    })
    this.paper = paper

    // это хак нужно чтобы на блоке срабатывало событие правой мышки, контекстного меню.
    paper.options.guard = function(evt) {
      return (evt.type === 'mousedown' && evt.buttons === 2);
    };

    /*
     * MENU
     */
    $(document).contextmenu({
      autoTrigger: false,
      delegate: ".joint-cell, .joint-paper",
      menu: [],

      beforeOpen: function(event, ui) {
        var $menu = ui.menu,
          target = ui.target,
          extraData = ui.extraData; // optionally passed when menu was opened by call to open()

        console.log('Target menu = ',target)
        let x = target.parent('.joint-cell')

        if ( target.parent().hasClass('joint-cell') || target.parent().parent().hasClass('joint-cell')) {
          // Redefine the whole menu
          $(document).contextmenu("replaceMenu", [
            { title: "Сделать связь", cmd: "magnet", uiIcon: "ui-icon-copy" },
          ]);
        } else if ( target[0].tagName == 'svg' ) {
          $(document).contextmenu("replaceMenu", [
            { title: "Add", cmd: "add", uiIcon: "ui-icon-create" },
          ]);
        }
      },
      select: function(event, ui) {
        console.log('Args = ', arguments)
        console.log('Event = ', event, ' UI = ', ui)

        if ( ui.cmd == 'magnet' ) {

          let x = ui.target[0].tagName != 'rect' ? ui.target.parents('.joint-cell') : ui.target
          let r
          if ( x.attr('data-type') == 'standard.Rectangle' ) {
            r = x.find('rect[joint-selector="body"]')
          } else if ( x.attr('data-type') == 'standard.BorderedImage' ) {
            r = x.find('image[joint-selector="image"]')
          } else if ( x.attr('data-type') == 'standard.HeaderedRectangle' ) {
            r = x.find('image[joint-selector="bodyImage"]')
          } else {
            r = x
          }
          r.attr("magnet", true)

        }
      }
    });

    // debug

    var rectangle = null

    // EVENTS

    paper.on({
      'link:connect': function (linkView, evt, elementViewConnected, magnet, arrowhead) {
        console.log('LINK CONNECTED')
        console.log('linkView = ', linkView)
        console.log('evt = ', evt)
        console.log('elementViewConnected = ', elementViewConnected)
        console.log('magnet = ', magnet)
        console.log('arrowhead = ', arrowhead)
        // only one link from source
        //if ( linkView.sourceMagnet.getAttribute('multiOut') != true ) linkView.sourceMagnet.setAttribute('magnet',false);
        //if ( linkView.targetMagnet.getAttribute('multiIn') != true ) linkView.targetMagnet.setAttribute('magnet',false);
        linkView.sourceMagnet.removeAttribute('magnet')
        delete linkView.model.attributes.source.selector
        delete linkView.model.attributes.target.selector

        linkView.model.attributes.source['anchor'] = {
          name: 'bottom'
        }
        linkView.model.attributes.target['anchor'] = {
          name: 'top'
        }

        paper.updateView(linkView)

      },

      'cell:contextmenu': function (cellView, evt, x, y) {
        console.log('cell:contextmenu cellView = ', cellView)
        console.log('event = ', evt)
        evt.cell = cellView
        $(document).contextmenu('open', evt, cellView)
      },
      'element:contextmenu': function (cellView, evt, x, y) {
        console.log('element:contextmenu cellView = ', cellView)
        console.log('event = ', evt)
        evt.cell = cellView
        $(document).contextmenu('open', evt, cellView)
      },

      'element:pointerdown': function (item, evt, x, y) {
        console.log('element:pointerdown')
        var data = item.data = {}
        console.log('event:', item)
        if (item.model.attributes.type == 'html.MyElement' ) {
          item.data.moveMode = true
          item.data.saveX = item.model.attributes.position.x
          item.data.saveY = item.model.attributes.position.y
          $(item.model.attributes.objHtml).css('z-index', '1000')
        } else if (item.model.attributes.type == "standard.Circle") {
          const { rows, cols, h, c, s, w, list } = self

          let row = item.model.attributes.row
          if ( list[row].length-1 == cols ) { return }

          let block = { name: window.prompt("Введите название структуры","Пусто") }

          let cc = list[row].length-1
          let rr = row

          let t = list[row].pop()
          list[row].push(block)
          list[row].push(t)

          let y = s * row + h * row
          let x = s * cc + w * cc
          // блок с текстом.
          var el1 = joint.shapes.html.MyElement.create({
            header: list[rr][cc]['name'],
            position: {x: x, y: y},
            row: rr,
            col: cc
          });
          el1.addTo(graph)
          list[rr][cc]['object'] = el1

          item.model.position(item.model.attributes.position.x+w+s, item.model.attributes.position.y)
        }
        return;

      },
      'element:pointermove': function (item, evt, x, y) {
        if ( item.data.moveMode ) {
          console.log('element:pointermove ', item, 'x=', x, ' y=', y)
          item.model.position(x, item.model.attributes.position.y)
        }

      },

      'element:pointerup': function (cell) {
        //var cell = evt.data.cell
        console.log(cell)
        let src = cell.model
        $(cell.model.attributes.objHtml).css('z-index','100')

        // если перетаскивание на элемент
        let list = graph.findModelsUnderElement(cell).filter(x => {
              return x != src && x.attributes.type != "standard.Circle"
        })
        if ( list.length == 1 ) {
          let dst = list[0]
          console.log(dst)
          let dstX = dst.attributes.position.x
          let dstY = dst.attributes.position.y
          src.position(dstX, dstY)
          dst.position(cell.data.saveX, cell.data.saveY)

          let dr = dst.attributes.row
          let dc = dst.attributes.col

          let sr = src.attributes.row
          let sc = src.attributes.col

          // обмениваем в массиве.
          let dobj = self.list[dr][dc]
          let sobj = self.list[sr][sc]
          self.list[sr][sc] = dobj
          self.list[dr][dc] = sobj

          //exchange
          dst.attributes.row = sr
          dst.attributes.col = sc

          src.attributes.row = dr
          src.attributes.col = dc
          console.log('list=',self.list)
        } else {
          //src.position(dstX, dstY)
          // если не нашли элементов под возвращаем элемент на его прежнюю позицию.
          src.position(cell.data.saveX, cell.data.saveY)
        }
      }

    })

    // Создаем контейнер для htmlView элеменетов которые накладываются поверх rect.

    var htmlContainer = document.createElement('div');
    htmlContainer.style.pointerEvents = 'none';
    htmlContainer.style.position = 'absolute';
    htmlContainer.style.inset = '0';
    paper.el.appendChild(htmlContainer);
    paper.htmlContainer = htmlContainer;

    // определяем свой блок с html
    htmlMyElementConstructor(joint,joint.util,joint.V)
    this.renderBlocks();
  }

  getLinks() {
    console.log('Json = ', this.graph.toJSON())
    let list = this.graph.toJSON()

    // Находим вершины
    console.log('Links')
    for (let n in list.cells) {
      // Если в линках находим в таргете
      if (list.cells[n].type == 'link') {
        console.log(list.cells[n])
      }
    }

  }

  renderBlocks() {
    const {rows, cols, c, s, w, h, thick, list} = this

    //this.graph.clear()

    for (let rr = 0; rr < list.length; rr++) {
      // расчитываем rows заголовки.
      let y = s * rr + h * rr
      if (list[rr].length == 0) {
        // кружок добавления если строка пустая.
        let el = new joint.shapes.standard.Circle({
          position: {x: 0, y: y + 2},
          size: {width: 30, height: 30},
          row: rr,
          col: 0,
          attrs: {
            label: {
              text: "+"
            },
            body: {
              fill: '#ffffff'
            }
          }
        });
        el.addTo(this.graph)
        list[rr][0] = {'object': el}
      }

      for (let cc = 0; cc < list[rr].length; cc++) {
        let x = s * cc + w * cc
        let obj = list[rr][cc]['object']

        // если кнопка то выходим
        if (obj != undefined && obj.attributes.type == "standard.Circle") {
          break;
        }

        // на последнем элементе добавляем еще и кнопку.
        if (obj == undefined) {
          // блок с текстом.
          var el1 = joint.shapes.html.MyElement.create({
            header: list[rr][cc]['name'],
            position: {x: x, y: y},
            row: rr,
            col: cc,
            id: list[rr][cc]['id']
          });
          el1.addTo(this.graph)
          list[rr][cc]['object'] = el1
        }

        if (cc == list[rr].length - 1) {
          // кружок добавления в конце линии
          let el = new joint.shapes.standard.Circle({
            position: {x: x+s+w, y: y + 2},
            size: {width: 30, height: 30},
            row: rr,
            col: cc,
            attrs: {
              label: {
                text: "+"
              },
              body: {
                fill: '#ffffff'
              }
            }
          });
          el.addTo(this.graph)
          list[rr][cc + 1] = {'object': el}
        }
      }
    }

    //  создаем связи.

    let elist = this.graph.toJSON()

    for (let i = 0; i < this.links.length;  i++) {

      var link = new joint.shapes.devs.Link({
        source: {
          id: this.links[i][0],
          port: 'out'
        },
        target: {
          id: this.links[i][1],
          port: 'in'
        },
        router: { name: 'metro' },
        connector: { name: 'rounded' }
      });
      // Assume graph has the srcModel and dstModel with in and out ports.
      this.graph.addCell(link)
    }

  }

  calculateHeaders() {
    const { rows, cols, c, s, w, h, thick } = this

    let rowsList = []
    let colsList = []

    let topButton
    let leftButton

    // расчитываем rows заголовки.
    for (let i = 0; i < rows; i++) {
      rowsList[i] = { x: 0, y: c+10+s*i+h*i  }

      if (i == rows-1) {
        leftButton = { x: 0, y: c+10+s*(i+1)+h*(i+1)  }
      }
    }

    // расчитываем cols заголовки.
    for (let i = 0; i < cols; i++) {
      //colsList[i] = { y:0, x: c+s*(i+1)+w*i  }
      colsList[i] = { y:0, x: c+10+s*i+w*i  }
      if (i == cols-1) {
        //topButton = { y: 0, x: c+s*(i+2)+w*(i+1)  }
        topButton = { y: 0, x: c+10+s*(i+1)+w*(i+1)  }
      }
    }
    return { rowsList:rowsList, colsList:colsList, topButton:topButton, leftButton:leftButton }
  }

  render () {
    const { modal } = this.props
    const { rows, cols, c, s, w, h, thick } = this

    this.calculateHeaders()
    let addHeaderTop = (() => {
      this.cols += 1
      this.setState(this.calculateHeaders());
    }).bind(this)

    let addHeaderLeft = (() => {
      this.rows += 1
      this.list.push([])
      this.setState(this.calculateHeaders());
      this.renderBlocks();

    }).bind(this)

    return (
      <React.Fragment>

        <div onClick={(this.getLinks).bind(this)} className="corner" style={{width: this.c, height: this.c}}></div>

        { this.state.colsList.map(n => (<div className="titleTop" style={{top:n.y+'px',left:n.x+'px', width: w, height: thick}}></div>) ) }
        <div onClick={addHeaderTop} className="titleTop" style={{backgroundColor:'red',top:this.state.topButton.y+'px',left:this.state.topButton.x+'px', width: w, height: thick}}>Добавить</div>

        { this.state.rowsList.map(n => (<div className="titleLeft" style={{top:n.y+'px',left:n.x+'px', width: thick, height: h }}></div>) ) }
        <div onClick={addHeaderLeft} className="titleLeft" style={{backgroundColor:'red',top:this.state.leftButton.y+'px',left:this.state.leftButton.x+'px', width: thick, height: h}}>Добавить</div>

        <div id="paper" style={{top:(c)+10+'px',left:(c)+10+'px'}} ></div>

      </React.Fragment>
    )
  }
}


export default DiagramFlow
