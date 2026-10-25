(function () {
  if (window.CMS && window.CMS.registerPreviewStyle) {
    window.CMS.registerPreviewStyle('/admin/preview.css');
  }
  if (window.CMS && window.createClass && window.h) {
    var h = window.h;
    window.CMS.registerPreviewTemplate('blog', window.createClass({
      render: function () {
        var entry = this.props.entry;
        var title = entry.getIn(['data','title']) || '未命名文章';
        var lang = entry.getIn(['data','lang']) === 'zh' ? 'zh-CN' : 'en';
        var cover = entry.getIn(['data','cover']);
        var date = new Date(entry.getIn(['data','date']));
        var dateLabel = Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(lang, { timeZone:'UTC', year:'numeric', month:'short', day:'numeric' });
        return h('article', { lang:lang },
          entry.getIn(['data','draft']) ? h('p', {className:'preview-draft'}, '草稿 · 不会在公开网站显示') : null,
          h('h1', {}, title),
          h('p', {className:'preview-meta'}, dateLabel),
          cover ? h('img', {src:this.props.getAsset(cover).toString(), alt:entry.getIn(['data','coverAlt']) || title}) : null,
          h('div', {className:'post-body'}, this.props.widgetFor('body'))
        );
      }
    }));
  }
})();
