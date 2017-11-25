import React, { Component } from 'react';
import { Route, Link, Switch } from 'react-router-dom';
import Articles from '../Articles';
import Article from '../Article';
import Header from '../Header';
import Footer from '../Footer';

const FadingRoute = ({ component: Component, path, ...other }) => (
    <Route exact path={path} render={props => (
        <Component {...other} {...props}/>
    )}/>
)
export default class App extends Component {
    constructor(props) {
        super();
        this.state = {
            minHeight: '100%'
        };
    }

    componentDidMount() {
        this.setState({
            minHeight: window.document && document.documentElement.clientHeight
        })
    }

    getQuery = (key) => {
        let search = window.location.search,
            ret = Object.create(null);

        if (typeof search !== 'string') {
            return key ? null : ret;
        }

        search = search.trim().replace(/^[?#&]/, '');

        if (!search) {
            return key ? null : ret;
        }

        search.split('&').forEach(function (param) {
            let parts = param.replace(/\+/g, ' ').split('=');
            let key = parts.shift();
            let val = parts.length > 0 ? parts.join('=') : undefined;

            val = val === undefined ? null : decodeURIComponent(val);

            ret[decodeURIComponent(key)] = val;
        });


        return key ? ret[key] : ret;

    }

    render() {
        const { minHeight } = this.state;
        const { InitData } = this.props;
        return (
            <div className="blog-layout" style={{minHeight: minHeight}}>
                <Header />
                    <FadingRoute path="/" component={Articles} {...InitData} getQuery={ this.getQuery } />
                    <FadingRoute path="/article/:id" component={Article} {...InitData} getQuery={ this.getQuery } />
                <Footer />
            </div>
        )
    }
}