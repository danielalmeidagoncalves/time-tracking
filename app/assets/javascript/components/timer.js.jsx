Timer = React.createClass({
  /**
  *  Initial state of the component
  **/
  getInitialState: function(){
    return {
      ellapsed: 0,
      parsed: "0",
      timerState: "stopped"
    };
  },
  /**
  * Creates a new time entry
  **/
  createTimeEntry: function(taskName,startTime){
    $.post( "time_entries.json",
    {
      "time_entry": {
        "name": taskName,
        "start_time": startTime
      }
    },
    function( data ) {
      console.log(data);
    });
  },
  /**
  * finish tasks by updating the time entry created
  **/
  finishTask: function(endTime){
    $.ajax({
      url: "/time_entries/running.json",
      type:"put",
      data: {
        "time_entry":{
          "end_time": endTime
        }
      }
    }).done(function(data) {
      console.log(data);
    });
  },
  /**
  *  Stoping the timer
  **/
  stop: function() {
    this.handleChangeStatus("stopped");
    var dateTime = new Date();
    var dateTimeWithISO = dateTime.toISOString();
    this.finishTask(dateTimeWithISO);
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      this.resetTimer();
    }
  },
  /**
  * Starting the timer.
  **/
  start: function() {
    this.handleChangeStatus("running");
    var dateTime = new Date();
    var dateTimeWithISO = dateTime.toISOString();
    var description = (typeof this.refs.taskDescription.value !== typeof undefined && this.refs.taskDescription.value === "")? "(no description)": this.refs.taskDescription.value;
    this.createTimeEntry(description,dateTimeWithISO);
    if (!this.interval) {
      this.interval = setInterval(this.update, 1000); // 1000 = 1s
    }
  },
  componentDidMount: function() {
    var self = this;
    $.ajax({
      url: "/time_entries/running.json",
      type:"get",
      success: function(data, textStatus, XMLHttpRequest){
          if(data.time_entry.name !== "(no description)"){
              self.refs.taskDescription.value = data.time_entry.name;
          }
          var timerSeconds = moment.duration(new Date()).asSeconds() - moment.duration(data.time_entry.start_time).asSeconds();
          self.resumeTimer(timerSeconds);
      },
      error:function (xhr, ajaxOptions, thrownError){
        if(xhr.status === 404){
            self.resetTimer();
        }
      }
    });
    $('#task-description').typeahead({
        ajax: {
          url: "/time_entries.json",
          method: "get",
          displayField: 'name',
          preDispatch: function (query) {
            return {
                q: query
            };
        },
        preProcess: function (data) {
            if (data.success === false) {
                return false;
            }
            console.log(data.time_entries);
            return data.time_entries;
        }
        }
    });
  },
  componentWillUnmount: function() {
    this.stop();
  },
  resumeTimer: function(seconds){
      this.setState({ellapsed: Math.floor(seconds)});
      this.setState({parsed: moment().startOf('day').seconds(this.state.ellapsed).format('HH:mm:ss')});
      this.start();
  },
  resetTimer: function(){
    this.setState({ellapsed: 0});
    this.setState({parsed: moment().startOf('day').seconds(0).format('HH:mm:ss')});
  },
  /**
  * Ticks the timer clock
  **/
  update: function() {
    this.setState({ellapsed: this.state.ellapsed + 1});
    this.setState({parsed: moment().startOf('day').seconds(this.state.ellapsed).format('HH:mm:ss')});
  },
  handleChangeStatus: function(state){
    this.setState({timerState: state});
    this.renderTimerButton();
  },
  renderTimerButton: function(){
    if(this.state.timerState === "running"){
      return <button
        className="btn-start button large expand red"
        onClick={this.stop}>STOP!</button>;
      } else {
        return <button
          className="btn-start button large expand green"
          onClick={this.start}>Go!</button>;
        }
      },
      render: function() {
        return <div className="row timer">
          <div className="description-container">
            <input
              type="text"
              placeholder="So, what are you rocking in?"
              className="narrow large task-description input-description popdown-input"
              ref="taskDescription"
              id="task-description"
              />
          </div>
          <div className="date-time-container">
            <div className="input-duration large task-duration popdown-input">
              {this.state.parsed}
            </div>
          </div>
          <div className="button-container">
            {this.renderTimerButton()}
          </div>
        </div>;
      }
    });
