import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import Scroll from 'react-scroll';
import _ from 'lodash';

import Pagination from '../../common/components/Pagination';
import SortableTable from '../../common/components/SortableTable';
import { loadPrescriptions } from '../actions/prescriptions';
import { openGlossaryModal } from '../actions/modals';
import GlossaryLink from '../components/GlossaryLink';
import SortMenu from '../components/SortMenu';
import { rxStatuses } from '../config';
import { formatDate } from '../utils/helpers';

const ScrollElement = Scroll.Element;
const scroller = Scroll.scroller;

class History extends React.Component {
  constructor(props) {
    super(props);
    this.formattedSortParam = this.formattedSortParam.bind(this);
    this.handleSort = this.handleSort.bind(this);
    this.handlePageSelect = this.handlePageSelect.bind(this);
    this.scrollToTop = this.scrollToTop.bind(this);
  }

  componentDidMount() {
    const query = _.pick(this.props.location.query, ['page', 'sort']);
    this.props.loadPrescriptions(query);
  }

  componentDidUpdate(prevProps) {
    const currentPage = this.props.page;
    const currentSort = this.formattedSortParam(
      this.props.sort.value,
      this.props.sort.order
    );

    const query = _.pick(this.props.location.query, ['page', 'sort']);
    const requestedPage = +query.page || currentPage;
    const requestedSort = query.sort || currentSort;

    const pageChanged = requestedPage !== currentPage;
    const sortChanged = requestedSort !== currentSort;

    if (pageChanged || sortChanged) {
      this.props.loadPrescriptions(query);
    }

    const pageUpdated = prevProps.page !== currentPage;

    if (pageUpdated) {
      this.scrollToTop();
    }
  }

  scrollToTop() {
    scroller.scrollTo('history', {
      duration: 500,
      delay: 0,
      smooth: true
    });
  }

  formattedSortParam(value, order) {
    const formattedValue = _.snakeCase(value);
    const sort = order === 'DESC'
               ? `-${formattedValue}`
               : formattedValue;
    return sort;
  }

  handleSort(value, order) {
    const sort = this.formattedSortParam(value, order);
    this.context.router.push({
      ...this.props.location,
      query: { ...this.props.location.query, sort }
    });
  }

  handlePageSelect(page) {
    this.context.router.push({
      ...this.props.location,
      query: { ...this.props.location.query, page }
    });
  }

  render() {
    const items = this.props.prescriptions;
    let content;

    if (items) {
      const currentSort = this.props.sort;

      const fields = [
        { label: 'Last submit date', value: 'refillSubmitDate' },
        { label: 'Last fill date', value: 'refillDate' },
        { label: 'Prescription', value: 'prescriptionName' },
        { label: 'Prescription status', value: 'refillStatus' }
      ];

      const data = items.map(item => {
        const attrs = item.attributes;
        const status = rxStatuses[attrs.refillStatus];

        return {
          id: item.id,

          refillSubmitDate: formatDate(attrs.refillSubmitDate),

          refillDate: formatDate(attrs.refillDate, { validateInPast: true }),

          prescriptionName: (
            <Link to={`/${attrs.prescriptionId}`}>
              {attrs.prescriptionName}
            </Link>
            ),

          refillStatus: (
            <GlossaryLink
                term={status}
                onClick={this.props.openGlossaryModal}/>
            )
        };
      });

      content = (
        <div>
          <p className="rx-tab-explainer">Your VA prescription refill history.</p>
          <SortMenu
              onChange={this.handleSort}
              options={fields}
              selected={currentSort.value}/>
          <SortableTable
              className="usa-table-borderless va-table-list rx-table rx-table-list"
              currentSort={currentSort}
              data={data}
              fields={fields}
              onSort={this.handleSort}/>
          <Pagination
              onPageSelect={this.handlePageSelect}
              page={this.props.page}
              pages={this.props.pages}/>
        </div>
      );
    } else {
      content = (
        <p className="rx-tab-explainer rx-loading-error">
          We couldn't retrieve your prescriptions.
          Please refresh this page or try again later.
        </p>
      );
    }

    return (
      <ScrollElement
          id="rx-history"
          name="history"
          className="va-tab-content">
        {content}
      </ScrollElement>
    );
  }
}

History.contextTypes = {
  router: React.PropTypes.object.isRequired
};

const mapStateToProps = (state) => {
  return {
    ...state.prescriptions.history,
    prescriptions: state.prescriptions.items
  };
};

const mapDispatchToProps = {
  loadPrescriptions,
  openGlossaryModal
};

export default connect(mapStateToProps, mapDispatchToProps)(History);
