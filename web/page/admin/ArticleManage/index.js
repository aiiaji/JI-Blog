import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Layout, Icon, Card, Col, Button, Modal, Pagination, Radio, Spin, Alert} from 'antd';
import Moment from 'moment';
import PropTypes from 'prop-types';
import Axios from 'axios';
import Masonry from 'react-masonry-component';
import './index.less';

const { Header, Content, Footer } = Layout;
const ButtonGroup = Button.Group;
const RadioGroup = Radio.Group;

export default class ArticleManege extends Component {
    constructor(props) {
        super(props);
        this.state = {
            pageSize: 12,
            articles: [],
            one: [],
            page: 1,
            allNum: 0,
            isCategoryModalShow: false,
            articleToExport: {},
            category: 'DEFAULT'
        };

        this.hasLoad = false;
    }

    static contextTypes = {
        showMessage: PropTypes.func
    };

    componentWillMount() {
        this.getArticles(1);
    }

    goEdit(article) {
        this.props.history.push({
            pathname: '/edit',
            search: `?aid=${article.id}`
        });
    }

    getOne() {
        Axios.get('/api/one')
            .then( res => {
                this.setState({
                    one: res.data.data
                })
            });
    }

    getArticles(_page) {
        const { pageSize, page } = this.state;
        Axios.get('/api/get/all/articles', {
            params: {
                page: _page || page,
                tag: '',
                pageSize: pageSize
            }
        })
        .then( res => {
            this.hasLoad = true;
            this.setState({
                articles: res.data.articles || [],
                page: res.data.page,
                allNum: res.data.allNum
            })
        });
    }

    doDelete(id) {
        return Axios
            .delete(`/api/article/${id}`)
            .then( res => {
                this.context.showMessage(res.data.message);
                if (res.data.code == 200) {
                    this.getArticles();
                }
            })
            .catch( err => {
                this.context.showMessage(err);
            })
    }

    deleteArticle = article => {
        Modal.confirm({
            title: '确定删除文章?',
            content: '文章删除后不可恢复',
            okText: '删除',
            okType: 'danger',
            cancelText: '取消',
            onOk: () => {
                return this.doDelete(article.id);
            }
        });
    }

    changePage = page => {
        this.getArticles(page);
    }

    getTimeString = (date) => {
        let now = new Date(),
            nowDate = now.getDate(),
            createTime = new Date(date),
            createDate = createTime.getDate(),
            diff = now.getTime() - date;
        // 1分钟内
        if (diff < 1000 * 60 ) {
            return '刚刚';
        } else if (diff < 1000 * 60 * 60) {
            // 1小时内
            return `${Math.ceil(diff / (1000 * 60))}分钟前`;
        } else if ( (diff < 1000 * 60 * 60 * 24) && (nowDate == createDate) ) {
            // 当天内
            return `今天 ${Moment(date).format('HH:mm')}`;
        } else if (now.getYear() == createTime.getYear() ) {
            return Moment(date).format('MM-DD HH:mm');
        } else {
            return Moment(date).format('Y-MM-DD');
        }
    }

    exportOrRecallArticle = (article) => {
        if (article.publish) {
            this.recallArticle(article.id)
        } else {
            this.setState({
                isCategoryModalShow: true,
                category: article.category,
                articleToExport: article
            });
        }
    }

    exportModalOk = () => {
        const { articleToExport, category } = this.state;
        Axios.post(`/api/publish/article/${articleToExport.id}`, {category})
            .then( res => {
                this.context.showMessage(res.data.message);
                this.setState({
                    isCategoryModalShow: false,
                });
                this.getArticles();
            })
            .catch( err => {
                this.context.showMessage('服务器错误');
            })
    }

    recallArticle = (aid) => {
        Axios.post(`/api/recall/article/${aid}`)
            .then( res => {
                this.context.showMessage(res.data.message);
                this.getArticles();
            })
            .catch( err => {
                this.context.showMessage('服务器错误');
            })
    }

    exportModalCancle = () => {
        this.setState({
            isCategoryModalShow: false
        });
    }

    onRadioChange = e => {
        this.setState({
            category: e.target.value
        })
    }

    showArticles() {
        const { articles } = this.state;
        const bodyStyle = { padding: '15px' };

        return articles.length ? articles.map( article => {
                return  <Col span={8} key={article.id} >
                    <Card title={article.title} hoverable  extra={<Icon type="delete" className="article-delete" onClick={ e => this.deleteArticle(article) } />} bodyStyle={bodyStyle} >
                        <div className="article-content">
                            {article.abstract || article.content.substr(0, 100)}
                        </div>
                        <div className="article-footer clearfix">
                            <span>{ this.getTimeString(article.createTime) }</span>
                            <ButtonGroup className="fr">
                              <Button ghost type="primary" size="small" onClick={ e => { this.exportOrRecallArticle(article) } } >
                                {article.publish ? <span><Icon type="rollback" />撤回</span> : <span><Icon type="export" />发布</span>}
                              </Button>
                              <Button ghost type="primary" size="small" onClick={ () => { this.goEdit(article) } } >
                               编辑<Icon type="edit" />
                              </Button>
                            </ButtonGroup>
                        </div>
                    </Card>
                </Col>
            }) : null;
    }

    render() {
        const { articles, page, allNum, pageSize, isCategoryModalShow, articleToExport, category } = this.state;
        return(
            <Layout className="article-manage-layout">
                <Header className='article-manage-header clearfix' >
                    <h3>文章管理</h3><Link to="/edit" className='fr'><Button icon="plus" >写文章</Button></Link>
                </Header>
                <Content className="article-manage-content">
                    <Masonry className="article-list">
                        { articles.length ? this.showArticles() : <Spin tip="Loading..." size='large' wrapperClassName='loading'>
                            <Alert
                              description="文章列表加载中..."
                              type="info"
                            />
                          </Spin> }
                    </Masonry>
                </Content>
                { articles.length ? <Footer><Pagination className='article-pn' showQuickJumper current={ page }  total={allNum} onChange={ this.changePage } pageSize={pageSize} /></Footer> : null}
                <Modal
                    title="选择发布板块"
                    visible={isCategoryModalShow}
                    onOk={this.exportModalOk}
                    mask={ false }
                    onCancel={this.exportModalCancle}>
                    <RadioGroup onChange={this.onRadioChange} value={ category }>
                        <Radio value='DEFAULT'>首页</Radio>
                        <Radio value='TRAVEL' >游记</Radio>
                    </RadioGroup>
                </Modal>
            </Layout>
        )
    }
}